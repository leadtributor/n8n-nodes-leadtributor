import type { IExecuteFunctions, INodeProperties } from 'n8n-workflow';

export interface ResourceModule {
	displayName: string;
	description: INodeProperties[];
	execute(this: IExecuteFunctions, i: number, operation: string, baseUrl: string): Promise<unknown>;
}
