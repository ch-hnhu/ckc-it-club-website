export interface Channel {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	image: string | null;
	posts_count: number;
}
