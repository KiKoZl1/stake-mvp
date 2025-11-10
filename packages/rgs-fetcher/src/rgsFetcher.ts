import type { paths } from './schema';
import { fetcher } from 'utils-fetcher';

type PathWithMethod<TMethod extends 'get' | 'post'> = {
	[K in keyof paths]: paths[K] extends Record<TMethod, any> ? K : never;
}[keyof paths];

type ResponseOf<TPath extends keyof paths, TMethod extends 'get' | 'post'> =
	paths[TPath] extends Record<
		TMethod,
		{
			responses: {
				200: {
					content: {
						'application/json': infer R;
					};
				};
			};
		}
	>
		? R
		: never;

type RequestBodyOf<TPath extends keyof paths> =
	paths[TPath] extends {
		post: {
			requestBody: {
				content: {
					'application/json': infer B;
				};
			};
		};
	}
		? B
		: never;

export const rgsFetcher = {
	post: async function post<
		T extends PathWithMethod<'post'>,
		TResponse = ResponseOf<T, 'post'>
	>(options: {
		url: T;
		rgsUrl: string;
		variables?: RequestBodyOf<T>;
	}): Promise<TResponse> {
		const response = await fetcher({
			method: 'POST',
			variables: options.variables as object | undefined,
			endpoint: `https://${options.rgsUrl}${options.url}`,
		});

		if (response.status !== 200) console.error('error', response);
		const data = await response.json();
		return data as TResponse;
	},
	get: async function get<
		T extends PathWithMethod<'get'>,
		TResponse = ResponseOf<T, 'get'>
	>(options: { url: T; rgsUrl: string }): Promise<TResponse> {
		const response = await fetcher({
			method: 'GET',
			endpoint: `https://${options.rgsUrl}${options.url}`,
		});

		if (response.status !== 200) console.error('error', response);
		const data = await response.json();
		return data as TResponse;
	},
};
