// AR Education Content Management Edge Function
// Handles AR content delivery, personalization, and progress tracking

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
};

interface ARContentRequest {
  action: 'get-recommended' | 'get-content' | 'update-progress' | 'get-tutorials' | 'track-session' | 'get-user-progress';
  user_id?: string;
  content_id?: string;
  progress_data?: any;
  session_data?: any;
  medication_name?: string;
  limit?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData: ARContentRequest = await req.json();
    const { action } = requestData;

    let result: any;

    switch (action) {
      case 'get-recommended':
        result = await getRecommendedContent(supabase, requestData.user_id!, requestData.limit || 10);
        break;

      case 'get-content':
        result = await getContentDetails(supabase, requestData.content_id!);
        break;

      case 'update-progress':
        result = await updateProgress(supabase, requestData.user_id!, requestData.content_id!, requestData.progress_data);
        break;

      case 'get-tutorials':
        result = await getTutorials(supabase, requestData.medication_name);
        break;

      case 'track-session':
        result = await trackSession(supabase, requestData.user_id!, requestData.session_data);
        break;

      case 'get-user-progress':
        result = await getUserProgress(supabase, requestData.user_id!);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('AR Education Content Error:', error);
    return new Response(JSON.stringify({
      error: {
        code: 'AR_CONTENT_ERROR',
        message: error.message || 'An error occurred processing AR content request'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Get personalized recommended AR content for user
async function getRecommendedContent(supabase: any, userId: string, limit: number) {
  // Use RPC function for intelligent recommendations
  const { data, error } = await supabase.rpc('get_recommended_ar_content', {
    p_user_id: userId,
    p_limit: limit
  });

  if (error) throw error;

  // Enrich with additional details
  const enrichedContent = [];
  for (const item of data || []) {
    const { data: contentDetails } = await supabase
      .from('ar_content_library')
      .select('*')
      .eq('id', item.content_id)
      .single();

    if (contentDetails) {
      enrichedContent.push({
        ...contentDetails,
        user_progress: item.progress_percentage
      });
    }
  }

  return {
    recommended_content: enrichedContent,
    total_count: enrichedContent.length
  };
}

// Get detailed AR content information
async function getContentDetails(supabase: any, contentId: string) {
  const { data: content, error } = await supabase
    .from('ar_content_library')
    .select('*')
    .eq('id', contentId)
    .single();

  if (error) throw error;

  // Get related tutorials if medication-linked
  let tutorials = [];
  if (content.medication_id) {
    const { data: tutorialData } = await supabase
      .from('medication_tutorials')
      .select('*')
      .limit(5);
    
    tutorials = tutorialData || [];
  }

  return {
    content,
    related_tutorials: tutorials,
    metadata: {
      estimated_completion: `${content.duration_minutes} minutes`,
      difficulty: content.difficulty_level,
      languages: content.languages
    }
  };
}

// Update user progress on AR content
async function updateProgress(supabase: any, userId: string, contentId: string, progressData: any) {
  const {
    progress_percentage = 0,
    completion_status = 'in_progress',
    time_spent_minutes = 0,
    quiz_score = null
  } = progressData;

  // Check if progress record exists
  const { data: existing } = await supabase
    .from('user_education_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .single();

  let result;
  const updateData = {
    progress_percentage,
    completion_status,
    time_spent_minutes: existing ? existing.time_spent_minutes + time_spent_minutes : time_spent_minutes,
    quiz_score,
    last_accessed_at: new Date().toISOString(),
    ...(completion_status === 'completed' && { completed_at: new Date().toISOString() })
  };

  if (existing) {
    const { data, error } = await supabase
      .from('user_education_progress')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    result = data;
  } else {
    const { data, error } = await supabase
      .from('user_education_progress')
      .insert({
        user_id: userId,
        content_id: contentId,
        ...updateData
      })
      .select()
      .single();

    if (error) throw error;
    result = data;
  }

  // Award certificate if completed with high score
  if (completion_status === 'completed' && quiz_score >= 80) {
    await supabase
      .from('user_education_progress')
      .update({ certificate_earned: true })
      .eq('id', result.id);
    
    result.certificate_earned = true;
  }

  return {
    progress: result,
    certificate_awarded: result.certificate_earned,
    next_recommendation: await getNextRecommendation(supabase, userId, contentId)
  };
}

// Get medication administration tutorials
async function getTutorials(supabase: any, medicationName?: string) {
  let query = supabase.from('medication_tutorials').select('*');
  
  if (medicationName) {
    query = query.ilike('medication_name', `%${medicationName}%`);
  }

  const { data, error } = await query.limit(20);
  if (error) throw error;

  return {
    tutorials: data || [],
    total_count: data?.length || 0,
    categories: [...new Set(data?.map((t: any) => t.device_type).filter(Boolean))]
  };
}

// Track AR session analytics
async function trackSession(supabase: any, userId: string, sessionData: any) {
  const {
    content_id,
    session_duration_seconds,
    device_type = 'mobile',
    interactions_count = 0,
    completion_achieved = false,
    feedback_rating = null,
    feedback_text = null
  } = sessionData;

  const { data, error } = await supabase
    .from('ar_session_analytics')
    .insert({
      user_id: userId,
      content_id,
      session_duration_seconds,
      device_type,
      interactions_count,
      completion_achieved,
      feedback_rating,
      feedback_text
    })
    .select()
    .single();

  if (error) throw error;

  return {
    session: data,
    analytics_recorded: true
  };
}

// Get user's complete education progress
async function getUserProgress(supabase: any, userId: string) {
  const { data: progress, error } = await supabase
    .from('user_education_progress')
    .select(`
      *,
      ar_content_library (*)
    `)
    .eq('user_id', userId)
    .order('last_accessed_at', { ascending: false });

  if (error) throw error;

  // Calculate overall statistics
  const stats = {
    total_content: progress?.length || 0,
    completed_count: progress?.filter((p: any) => p.completion_status === 'completed').length || 0,
    in_progress_count: progress?.filter((p: any) => p.completion_status === 'in_progress').length || 0,
    certificates_earned: progress?.filter((p: any) => p.certificate_earned).length || 0,
    total_time_spent: progress?.reduce((sum: number, p: any) => sum + (p.time_spent_minutes || 0), 0) || 0,
    average_quiz_score: calculateAverageScore(progress)
  };

  return {
    progress: progress || [],
    statistics: stats,
    achievements: generateAchievements(stats)
  };
}

// Helper: Get next recommended content after completion
async function getNextRecommendation(supabase: any, userId: string, completedContentId: string) {
  const { data: completed } = await supabase
    .from('ar_content_library')
    .select('content_type, difficulty_level')
    .eq('id', completedContentId)
    .single();

  if (!completed) return null;

  // Recommend next difficulty level or same type
  const nextDifficulty = {
    'beginner': 'intermediate',
    'intermediate': 'advanced',
    'advanced': 'advanced'
  }[completed.difficulty_level] || 'beginner';

  const { data: nextContent } = await supabase
    .from('ar_content_library')
    .select('*')
    .eq('content_type', completed.content_type)
    .eq('difficulty_level', nextDifficulty)
    .is_active(true)
    .limit(1)
    .single();

  return nextContent;
}

// Helper: Calculate average quiz score
function calculateAverageScore(progress: any[]): number {
  if (!progress || progress.length === 0) return 0;
  
  const scores = progress
    .map(p => p.quiz_score)
    .filter(s => s !== null && s !== undefined);
  
  if (scores.length === 0) return 0;
  
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

// Helper: Generate achievement badges
function generateAchievements(stats: any): any[] {
  const achievements = [];

  if (stats.completed_count >= 1) {
    achievements.push({ name: 'First Steps', description: 'Completed your first AR lesson' });
  }
  if (stats.completed_count >= 5) {
    achievements.push({ name: 'Dedicated Learner', description: 'Completed 5 AR lessons' });
  }
  if (stats.completed_count >= 10) {
    achievements.push({ name: 'Expert Student', description: 'Completed 10 AR lessons' });
  }
  if (stats.certificates_earned >= 3) {
    achievements.push({ name: 'Certificate Collector', description: 'Earned 3 certificates' });
  }
  if (stats.total_time_spent >= 60) {
    achievements.push({ name: 'Time Invested', description: 'Spent 1+ hour learning' });
  }
  if (stats.average_quiz_score >= 90) {
    achievements.push({ name: 'High Achiever', description: 'Average quiz score of 90+' });
  }

  return achievements;
}
