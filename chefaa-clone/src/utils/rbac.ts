import { jwtService } from '../lib/jwt';

/**
 * User roles in the pharmaceutical platform
 */
export enum UserRole {
  PATIENT = 'patient',
  PHARMACIST = 'pharmacist',
  DOCTOR = 'doctor',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

/**
 * Resource types that can be accessed
 */
export enum Resource {
  PROFILE = 'profile',
  ORDERS = 'orders',
  PRESCRIPTIONS = 'prescriptions',
  MEDICAL_RECORDS = 'medical-records',
  SAFETY_ANALYSIS = 'safety-analysis',
  PILL_VERIFICATION = 'pill-verification',
  DRUG_PROVENANCE = 'drug-provenance',
  SMART_CONTRACT = 'smart-contract',
  IOT_ADHERENCE = 'iot-adherence',
  AR_EDUCATION = 'ar-education',
  CLINICAL_TRIALS = 'clinical-trials',
  PATIENT_RECORDS = 'patient-records',
  DRUG_DATABASE = 'drug-database',
  ADMIN_DASHBOARD = 'admin-dashboard',
  SECURITY_DASHBOARD = 'security-dashboard',
  COMPLIANCE_CENTER = 'compliance-center',
  ANALYTICS = 'analytics',
  USERS = 'users',
  SETTINGS = 'settings',
}

/**
 * Available actions on resources
 */
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  VERIFY = 'verify',
  APPROVE = 'approve',
  MANAGE = 'manage',
  VIEW_ALL = 'view_all',
}

/**
 * Permission definition
 */
interface Permission {
  resource: Resource | '*';
  actions: (Action | '*')[];
}

/**
 * Role-Based Access Control Manager
 */
export class RBACManager {
  private static instance: RBACManager;
  
  // Define permissions for each role
  private permissions: Record<UserRole, Permission[]> = {
    [UserRole.PATIENT]: [
      { resource: Resource.PROFILE, actions: [Action.READ, Action.UPDATE] },
      { resource: Resource.ORDERS, actions: [Action.READ, Action.CREATE] },
      { resource: Resource.PRESCRIPTIONS, actions: [Action.READ, Action.CREATE] },
      { resource: Resource.MEDICAL_RECORDS, actions: [Action.READ] },
      { resource: Resource.SAFETY_ANALYSIS, actions: [Action.READ, Action.CREATE] },
      { resource: Resource.PILL_VERIFICATION, actions: [Action.READ, Action.CREATE] },
      { resource: Resource.DRUG_PROVENANCE, actions: [Action.READ] },
      { resource: Resource.SMART_CONTRACT, actions: [Action.READ, Action.CREATE] },
      { resource: Resource.IOT_ADHERENCE, actions: [Action.READ] },
      { resource: Resource.AR_EDUCATION, actions: [Action.READ] },
      { resource: Resource.CLINICAL_TRIALS, actions: [Action.READ, Action.CREATE] },
      { resource: Resource.COMPLIANCE_CENTER, actions: [Action.READ, Action.UPDATE] },
    ],
    [UserRole.PHARMACIST]: [
      { resource: Resource.PROFILE, actions: [Action.READ, Action.UPDATE] },
      { resource: Resource.ORDERS, actions: [Action.READ, Action.UPDATE] },
      { resource: Resource.PRESCRIPTIONS, actions: [Action.READ, Action.UPDATE, Action.VERIFY] },
      { resource: Resource.PATIENT_RECORDS, actions: [Action.READ] },
      { resource: Resource.DRUG_DATABASE, actions: [Action.READ] },
      { resource: Resource.SAFETY_ANALYSIS, actions: [Action.READ, Action.CREATE] },
      { resource: Resource.PILL_VERIFICATION, actions: [Action.READ, Action.CREATE, Action.VERIFY] },
      { resource: Resource.DRUG_PROVENANCE, actions: [Action.READ, Action.VERIFY] },
      { resource: Resource.SMART_CONTRACT, actions: [Action.READ, Action.UPDATE] },
      { resource: Resource.IOT_ADHERENCE, actions: [Action.READ] },
      { resource: Resource.AR_EDUCATION, actions: [Action.READ] },
    ],
    [UserRole.DOCTOR]: [
      { resource: Resource.PROFILE, actions: [Action.READ, Action.UPDATE] },
      { resource: Resource.PRESCRIPTIONS, actions: [Action.READ, Action.CREATE, Action.UPDATE] },
      { resource: Resource.PATIENT_RECORDS, actions: [Action.READ, Action.UPDATE] },
      { resource: Resource.MEDICAL_RECORDS, actions: [Action.READ, Action.CREATE, Action.UPDATE] },
      { resource: Resource.SAFETY_ANALYSIS, actions: [Action.READ, Action.CREATE] },
      { resource: Resource.DRUG_DATABASE, actions: [Action.READ] },
      { resource: Resource.CLINICAL_TRIALS, actions: [Action.READ, Action.CREATE, Action.MANAGE] },
      { resource: Resource.AR_EDUCATION, actions: [Action.READ, Action.CREATE] },
      { resource: Resource.SMART_CONTRACT, actions: [Action.READ, Action.CREATE] },
    ],
    [UserRole.MODERATOR]: [
      { resource: Resource.PRESCRIPTIONS, actions: [Action.READ, Action.VERIFY] },
      { resource: Resource.ORDERS, actions: [Action.READ] },
      { resource: Resource.DRUG_DATABASE, actions: [Action.READ, Action.UPDATE] },
      { resource: Resource.AR_EDUCATION, actions: [Action.READ, Action.UPDATE] },
      { resource: Resource.ANALYTICS, actions: [Action.READ] },
      { resource: Resource.COMPLIANCE_CENTER, actions: [Action.READ] },
    ],
    [UserRole.ADMIN]: [
      { resource: '*' as Resource, actions: ['*' as Action] },
    ],
  };

  private constructor() {}

  static getInstance(): RBACManager {
    if (!RBACManager.instance) {
      RBACManager.instance = new RBACManager();
    }
    return RBACManager.instance;
  }

  /**
   * Check if current user can perform an action on a resource
   */
  async canAccess(resource: Resource, action: Action): Promise<boolean> {
    const role = await jwtService.getUserRole();
    if (!role) {
      return false;
    }

    return this.canRoleAccess(role as UserRole, resource, action);
  }

  /**
   * Check if a specific role can perform an action on a resource
   */
  canRoleAccess(role: UserRole, resource: Resource, action: Action): boolean {
    const rolePermissions = this.permissions[role] || [];

    // Check for wildcard permissions (admin)
    const hasWildcard = rolePermissions.some(
      p => (p.resource === '*' || p.resource === resource) && 
           (p.actions.includes('*') || p.actions.includes(action))
    );

    if (hasWildcard) {
      return true;
    }

    // Check for specific resource permissions
    const resourcePermission = rolePermissions.find(
      p => p.resource === resource
    );

    return resourcePermission?.actions.includes(action) || false;
  }

  /**
   * Get all resources a role can access
   */
  getRoleResources(role: UserRole): Resource[] {
    const rolePermissions = this.permissions[role] || [];
    
    if (rolePermissions.some(p => p.resource === '*')) {
      return Object.values(Resource);
    }

    return rolePermissions
      .map(p => p.resource)
      .filter((r): r is Resource => r !== '*');
  }

  /**
   * Get all actions a role can perform on a resource
   */
  getRoleActions(role: UserRole, resource: Resource): Action[] {
    const rolePermissions = this.permissions[role] || [];

    // Check for wildcard permissions
    const wildcardPermission = rolePermissions.find(p => p.resource === '*');
    if (wildcardPermission?.actions.includes('*')) {
      return Object.values(Action);
    }

    // Get specific resource permissions
    const resourcePermission = rolePermissions.find(p => p.resource === resource);
    if (!resourcePermission) {
      return [];
    }

    if (resourcePermission.actions.includes('*')) {
      return Object.values(Action);
    }

    return resourcePermission.actions.filter((a): a is Action => a !== '*');
  }

  /**
   * Check if current user has any of the specified roles
   */
  async hasAnyRole(roles: UserRole[]): Promise<boolean> {
    return await jwtService.hasAnyRole(roles);
  }

  /**
   * Check if current user has a specific role
   */
  async hasRole(role: UserRole): Promise<boolean> {
    return await jwtService.hasRole(role);
  }

  /**
   * Get current user's role
   */
  async getCurrentRole(): Promise<UserRole | null> {
    const role = await jwtService.getUserRole();
    return role as UserRole | null;
  }
}

// Export singleton instance
export const rbacManager = RBACManager.getInstance();

/**
 * React hook for role-based access control
 */
export function useRBAC() {
  const canAccess = async (resource: Resource, action: Action): Promise<boolean> => {
    return rbacManager.canAccess(resource, action);
  };

  const hasRole = async (role: UserRole): Promise<boolean> => {
    return rbacManager.hasRole(role);
  };

  const hasAnyRole = async (roles: UserRole[]): Promise<boolean> => {
    return rbacManager.hasAnyRole(roles);
  };

  const getCurrentRole = async (): Promise<UserRole | null> => {
    return rbacManager.getCurrentRole();
  };

  return {
    canAccess,
    hasRole,
    hasAnyRole,
    getCurrentRole,
  };
}
