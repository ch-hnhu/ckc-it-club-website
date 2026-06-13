export interface MailTemplateType {
	id: number;
	slug: string;
	label: string;
	description: string | null;
	templates_count: number;
	created_at: string | null;
	updated_at: string | null;
}

export interface MailTemplateTypeDetail extends MailTemplateType {
	templates?: MailTemplate[];
}

export interface MailTemplate {
	id: number;
	mail_template_type_id: number;
	name: string;
	subject: string;
	body: string;
	is_default: boolean;
	created_at: string | null;
	updated_at: string | null;
}

export type CreateMailTemplatePayload = {
	name: string;
	subject: string;
	body: string;
	is_default?: boolean;
};

export type UpdateMailTemplatePayload = CreateMailTemplatePayload;
