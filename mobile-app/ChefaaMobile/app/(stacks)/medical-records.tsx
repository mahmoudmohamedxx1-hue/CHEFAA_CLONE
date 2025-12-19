import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchMedicalRecords } from '@/store/slices/medicalRecordsSlice';

export default function MedicalRecordsScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const { records } = useSelector((state: RootState) => state.medicalRecords);

  useEffect(() => {
    dispatch(fetchMedicalRecords());
  }, [dispatch]);

  const recordTypes = [
    { type: 'prescription', label: 'Prescriptions', icon: 'medical', color: '#3B82F6' },
    { type: 'lab_result', label: 'Lab Results', icon: 'document-text', color: '#10B981' },
    { type: 'medical_image', label: 'Medical Images', icon: 'image', color: '#F59E0B' },
    { type: 'visit_summary', label: 'Visit Summary', icon: 'people', color: '#8B5CF6' },
    { type: 'vaccination', label: 'Vaccinations', color: '#EF4444' },
    { type: 'allergy', label: 'Allergies', color: '#EC4899' },
  ];

  const renderRecordType = (item: any) => {
    const recordsCount = records.filter(r => r.record_type === item.type).length;
    
    return (
      <TouchableOpacity
        style={styles.recordTypeCard}
        onPress={() => router.push('/(stacks)/medical-records-type' as never, { type: item.type } as never)}
      >
        <View style={[styles.recordTypeIcon, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={item.icon as any} size={24} color={item.color} />
        </View>
        <Text style={styles.recordTypeLabel}>{item.label}</Text>
        <View style={styles.recordCountBadge}>
          <Text style={styles.recordCountText}>{recordsCount}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRecord = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.recordCard}
      onPress={() => router.push('/(stacks)/medical-record-detail' as never, { id: item.id } as never)}
    >
      <View style={styles.recordHeader}>
        <View style={styles.recordType}>
          <Ionicons name="medical" size={16} color="#2563EB" />
          <Text style={styles.recordTypeText}>{item.record_type.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <Text style={styles.recordDate}>
          {new Date(item.record_date).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.recordTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.recordDescription} numberOfLines={2}>
        {item.description}
      </Text>
      {item.file_url && (
        <View style={styles.fileAttachment}>
          <Ionicons name="attach" size={16} color="#6B7280" />
          <Text style={styles.fileText}>Attachment</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical Records</Text>
        <TouchableOpacity onPress={() => router.push('/(stacks)/upload-record' as never)}>
          <Ionicons name="add" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{records.length}</Text>
            <Text style={styles.statLabel}>Total Records</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {records.filter(r => r.record_type === 'prescription').length}
            </Text>
            <Text style={styles.statLabel}>Prescriptions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {records.filter(r => !r.is_confidential).length}
            </Text>
            <Text style={styles.statLabel}>Shared</Text>
          </View>
        </View>

        {/* Record Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Record Types</Text>
          <View style={styles.recordTypesGrid}>
            {recordTypes.map((type, index) => (
              <View key={index} style={styles.recordTypeWrapper}>
                {renderRecordType(type)}
              </View>
            ))}
          </View>
        </View>

        {/* Recent Records */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Records</Text>
            <TouchableOpacity onPress={() => router.push('/(stacks)/all-records' as never)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={records.slice(0, 5)}
            renderItem={renderRecord}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No medical records yet</Text>
                <Text style={styles.emptySubtext}>
                  Upload your first medical record to get started
                </Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => router.push('/(stacks)/upload-record' as never)}
                >
                  <Text style={styles.uploadButtonText}>Upload Record</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Poppins-Bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginVertical: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 4,
    fontFamily: 'Poppins-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Poppins-Bold',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2563EB',
    fontFamily: 'Poppins-Medium',
  },
  recordTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recordTypeWrapper: {
    width: '30%',
    alignItems: 'center',
  },
  recordTypeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  recordTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  recordTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  recordCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordTypeText: {
    fontSize: 10,
    color: '#2563EB',
    marginLeft: 4,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  recordDate: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  recordDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontFamily: 'Poppins-Regular',
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontFamily: 'Poppins-Regular',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    fontFamily: 'Poppins-Regular',
  },
  uploadButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});