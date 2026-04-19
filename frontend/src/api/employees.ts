import api from '../auth/api';

export type EmployeeStatus = 'active' | 'inactive';

export interface EmployeeRecord {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    phone: string;
    designation: string;
    department: string;
    joining_date: string;
    status: EmployeeStatus;
    created_at: string;
    updated_at: string;
}

interface ApiEmployee {
    id: number | string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    designation?: string;
    department?: string;
    joining_date?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
}

interface EmployeeListResponse {
    data?: ApiEmployee[];
    total?: number;
}

export interface EmployeeListPayload {
    rows: EmployeeRecord[];
    total: number;
}

const normalizeStatus = (value: string | undefined): EmployeeStatus => {
    const normalized = (value || '').toLowerCase();
    return normalized === 'inactive' ? 'inactive' : 'active';
};

const normalizeEmployee = (employee: ApiEmployee): EmployeeRecord => {
    const firstName = String(employee.first_name || '');
    const lastName = String(employee.last_name || '');

    return {
        id: String(employee.id),
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim() || 'Unknown Employee',
        email: String(employee.email || ''),
        phone: String(employee.phone || ''),
        designation: String(employee.designation || ''),
        department: String(employee.department || ''),
        joining_date: String(employee.joining_date || ''),
        status: normalizeStatus(employee.status),
        created_at: String(employee.created_at || ''),
        updated_at: String(employee.updated_at || ''),
    };
};

export const fetchEmployees = async (
    page = 1,
    pageSize = 200,
    department?: string,
    status?: EmployeeStatus
): Promise<EmployeeListPayload> => {
    const response = await api.get<EmployeeListResponse>('/employees', {
        timeout: 5000,
        params: {
            page,
            page_size: pageSize,
            department: department || undefined,
            status: status || undefined,
        },
    });

    const rows = Array.isArray(response.data?.data)
        ? response.data.data.map(normalizeEmployee)
        : [];

    return {
        rows,
        total: Number(response.data?.total || rows.length),
    };
};
