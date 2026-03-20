import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class LeadtributorApi implements ICredentialType {
	name = 'leadtributorApi';
	displayName = 'Leadtributor API';
	documentationUrl = 'https://api.leadtributor.cloud';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your Leadtributor API key. Sent as the value of the Authorization header.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: 'https://api.leadtributor.cloud',
			description:
				'Base URL of the Leadtributor API. Use https://api.demo.leadtributor.cloud for the demo environment.',
		},
	];

	// The API uses an apiKey security scheme with the key sent directly
	// in the Authorization header (no Bearer prefix).
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/test',
			method: 'GET',
		},
	};
}
