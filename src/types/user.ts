export interface UserDTO {
    id?: number;
    login: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    activated?: boolean;
    langKey?: string;
    authorities?: string[];
    createdBy?: string;
    createdDate?: Date;
    lastModifiedBy?: string;
    lastModifiedDate?: Date;
}
