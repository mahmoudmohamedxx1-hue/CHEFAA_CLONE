import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, data } = await req.json();

    switch (action) {
      case 'register_device': {
        // Register new IoT device
        const { userId, deviceType, deviceId, deviceName, manufacturer, model } = data;

        const { data: device, error: deviceError } = await supabase
          .from('iot_devices')
          .insert({
            user_id: userId,
            device_type: deviceType,
            device_id: deviceId,
            device_name: deviceName || `${deviceType.replace('_', ' ')} ${deviceId.slice(-4)}`,
            manufacturer: manufacturer || 'Generic',
            model: model || 'Standard',
            firmware_version: '1.0.0',
            connection_status: 'online',
            last_connection: new Date().toISOString(),
            battery_level: 100,
            configuration: {},
          })
          .select()
          .single();

        if (deviceError) {
          throw deviceError;
        }

        return new Response(JSON.stringify({ device }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update_device_status': {
        // Update device connection and battery status
        const { deviceId, connectionStatus, batteryLevel } = data;

        const { error: updateError } = await supabase
          .from('iot_devices')
          .update({
            connection_status: connectionStatus,
            battery_level: batteryLevel,
            last_connection: new Date().toISOString(),
          })
          .eq('device_id', deviceId);

        if (updateError) {
          throw updateError;
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'record_adherence': {
        // Record medication adherence event from IoT device
        const { userId, deviceId, medicationName, scheduledTime, actualTime, adherenceStatus, doseAmount, deviceReading } = data;

        // Get device info
        const { data: device } = await supabase
          .from('iot_devices')
          .select('id')
          .eq('device_id', deviceId)
          .single();

        if (!device) {
          throw new Error('Device not found');
        }

        const { data: adherence, error: adherenceError } = await supabase
          .from('adherence_data')
          .insert({
            user_id: userId,
            device_id: device.id,
            medication_name: medicationName,
            scheduled_time: scheduledTime,
            actual_time: actualTime || null,
            adherence_status: adherenceStatus,
            dose_amount: doseAmount,
            device_reading: deviceReading || {},
          })
          .select()
          .single();

        if (adherenceError) {
          throw adherenceError;
        }

        // Analyze adherence pattern and trigger interventions if needed
        await analyzeAndIntervene(supabase, userId, adherenceStatus, medicationName);

        return new Response(JSON.stringify({ adherence }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_adherence_analytics': {
        // Calculate adherence analytics for user
        const { userId, periodDays } = data;

        const periodStart = new Date();
        periodStart.setDate(periodStart.getDate() - (periodDays || 30));

        const { data: adherenceData } = await supabase
          .from('adherence_data')
          .select('*')
          .eq('user_id', userId)
          .gte('scheduled_time', periodStart.toISOString())
          .order('scheduled_time', { ascending: false });

        if (!adherenceData || adherenceData.length === 0) {
          return new Response(JSON.stringify({ analytics: null }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const totalScheduled = adherenceData.length;
        const dosesTaken = adherenceData.filter(d => d.adherence_status === 'taken').length;
        const dosesMissed = adherenceData.filter(d => d.adherence_status === 'missed').length;
        const adherenceRate = (dosesTaken / totalScheduled) * 100;

        // Calculate streak
        let currentStreak = 0;
        let bestStreak = 0;
        let streak = 0;

        for (const entry of adherenceData.reverse()) {
          if (entry.adherence_status === 'taken') {
            streak++;
            if (streak > bestStreak) bestStreak = streak;
          } else {
            if (currentStreak === 0) currentStreak = streak;
            streak = 0;
          }
        }
        if (currentStreak === 0) currentStreak = streak;

        // Calculate average delay
        const delayData = adherenceData
          .filter(d => d.adherence_status === 'late' || (d.actual_time && d.scheduled_time))
          .map(d => {
            const scheduled = new Date(d.scheduled_time).getTime();
            const actual = new Date(d.actual_time).getTime();
            return Math.max(0, (actual - scheduled) / 60000); // minutes
          });
        const avgDelay = delayData.length > 0 ? Math.round(delayData.reduce((a, b) => a + b, 0) / delayData.length) : 0;

        // Determine risk level
        const riskLevel = adherenceRate >= 80 ? 'low' : adherenceRate >= 60 ? 'medium' : 'high';

        // Generate AI recommendations
        const recommendations = generateRecommendations(adherenceRate, dosesMissed, avgDelay, currentStreak);

        const analytics = {
          period_start: periodStart.toISOString().split('T')[0],
          period_end: new Date().toISOString().split('T')[0],
          total_scheduled_doses: totalScheduled,
          doses_taken: dosesTaken,
          doses_missed: dosesMissed,
          adherence_rate: Math.round(adherenceRate * 100) / 100,
          improvement_vs_previous: 0, // Would compare with previous period
          streak_days: currentStreak,
          best_streak_days: bestStreak,
          avg_delay_minutes: avgDelay,
          risk_level: riskLevel,
          ai_recommendations: recommendations,
        };

        // Save analytics
        await supabase.from('adherence_analytics').insert({
          user_id: userId,
          ...analytics,
        });

        return new Response(JSON.stringify({ analytics }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create_intervention': {
        // Create AI-driven intervention
        const { userId, interventionType, triggerEvent, message, priority, aiConfidence } = data;

        const { data: intervention, error: interventionError } = await supabase
          .from('interventions')
          .insert({
            user_id: userId,
            intervention_type: interventionType,
            trigger_event: triggerEvent,
            intervention_method: determineInterventionMethod(priority),
            message_content: message,
            priority: priority || 'normal',
            ai_confidence_score: aiConfidence || 0.75,
            sent_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (interventionError) {
          throw interventionError;
        }

        // If high priority, also send caregiver notification
        if (priority === 'high' || priority === 'urgent') {
          // Get user's caregiver info (would be stored in user profile)
          await sendCaregiverNotification(supabase, userId, message, priority);
        }

        return new Response(JSON.stringify({ intervention }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_user_devices': {
        // Get all devices for user
        const { userId } = data;

        const { data: devices } = await supabase
          .from('iot_devices')
          .select('*')
          .eq('user_id', userId)
          .order('registered_at', { ascending: false });

        return new Response(JSON.stringify({ devices: devices || [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_recent_adherence': {
        // Get recent adherence data
        const { userId, limit } = data;

        const { data: adherenceData } = await supabase
          .from('adherence_data')
          .select(`
            *,
            device:iot_devices(device_name, device_type)
          `)
          .eq('user_id', userId)
          .order('scheduled_time', { ascending: false })
          .limit(limit || 50);

        return new Response(JSON.stringify({ data: adherenceData || [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_interventions': {
        // Get user interventions
        const { userId } = data;

        const { data: interventions } = await supabase
          .from('interventions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);

        return new Response(JSON.stringify({ interventions: interventions || [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'simulate_device_reading': {
        // Simulate IoT device reading for demo
        const { deviceType, userId, medicationName } = data;

        let deviceReading = {};

        switch (deviceType) {
          case 'smart_pill_dispenser':
            deviceReading = {
              dispensed: true,
              timestamp: new Date().toISOString(),
              compartment: Math.floor(Math.random() * 7) + 1,
              pills_remaining: Math.floor(Math.random() * 30),
            };
            break;
          case 'connected_inhaler':
            deviceReading = {
              puffs_taken: Math.floor(Math.random() * 3) + 1,
              technique_score: Math.floor(Math.random() * 30) + 70,
              flow_rate: Math.floor(Math.random() * 20) + 30,
              timestamp: new Date().toISOString(),
            };
            break;
          case 'glucose_monitor':
            deviceReading = {
              glucose_level: Math.floor(Math.random() * 80) + 80,
              trend: ['rising', 'falling', 'stable'][Math.floor(Math.random() * 3)],
              timestamp: new Date().toISOString(),
            };
            break;
          case 'blood_pressure_monitor':
            deviceReading = {
              systolic: Math.floor(Math.random() * 40) + 110,
              diastolic: Math.floor(Math.random() * 20) + 70,
              pulse: Math.floor(Math.random() * 30) + 60,
              timestamp: new Date().toISOString(),
            };
            break;
        }

        return new Response(JSON.stringify({ reading: deviceReading }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
    }
  } catch (error) {
    console.error('IoT adherence error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'IOT_ADHERENCE_ERROR',
          message: error.message,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper functions
async function analyzeAndIntervene(supabase: any, userId: string, adherenceStatus: string, medicationName: string) {
  if (adherenceStatus === 'missed') {
    // Check for pattern of missed doses
    const { data: recentMissed } = await supabase
      .from('adherence_data')
      .select('id')
      .eq('user_id', userId)
      .eq('adherence_status', 'missed')
      .gte('scheduled_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (recentMissed && recentMissed.length >= 3) {
      // Create intervention
      await supabase.from('interventions').insert({
        user_id: userId,
        intervention_type: 'reminder',
        trigger_event: 'pattern_detected',
        intervention_method: 'push_notification',
        message_content: `We noticed you've missed ${recentMissed.length} doses of ${medicationName} this week. Let's work together to improve your adherence.`,
        priority: 'high',
        ai_confidence_score: 0.85,
        sent_at: new Date().toISOString(),
      });
    }
  }
}

function generateRecommendations(adherenceRate: number, missedDoses: number, avgDelay: number, streak: number) {
  const recommendations = [];

  if (adherenceRate < 80) {
    recommendations.push({
      type: 'adherence_improvement',
      message: 'Consider setting reminders 15 minutes before scheduled dose times',
      priority: 'high',
    });
  }

  if (missedDoses > 5) {
    recommendations.push({
      type: 'pattern_alert',
      message: 'Multiple missed doses detected. Speak with your healthcare provider about simplifying your regimen',
      priority: 'urgent',
    });
  }

  if (avgDelay > 60) {
    recommendations.push({
      type: 'timing_optimization',
      message: 'Doses are consistently delayed. Consider adjusting your schedule to match your routine',
      priority: 'medium',
    });
  }

  if (streak >= 7) {
    recommendations.push({
      type: 'positive_reinforcement',
      message: `Great job! You're on a ${streak}-day streak. Keep up the excellent work!`,
      priority: 'low',
    });
  }

  return recommendations;
}

function determineInterventionMethod(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'phone_call';
    case 'high':
      return 'sms';
    case 'normal':
      return 'push_notification';
    default:
      return 'email';
  }
}

async function sendCaregiverNotification(supabase: any, userId: string, message: string, alertLevel: string) {
  // In production, would lookup caregiver info from user profile
  const caregiverEmail = 'caregiver@example.com'; // Placeholder

  await supabase.from('caregiver_notifications').insert({
    patient_id: userId,
    caregiver_email: caregiverEmail,
    notification_type: 'adherence_alert',
    alert_level: alertLevel,
    message: message,
    sent_at: new Date().toISOString(),
  });
}
