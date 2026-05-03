# n8n-nodes-leadtributor

This is an n8n community node that lets you integrate [leadtributor.cloud](https://leadtributor.cloud) into your n8n workflows.

[leadtributor.cloud](https://leadtributor.cloud) is a B2B SaaS platform for lead distribution and partner relationship management (PRM), helping companies route inbound leads to the right sales partners and track them through the funnel.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation) · [Operations](#operations) · [Credentials](#credentials) · [Compatibility](#compatibility) · [Usage](#usage) · [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

In n8n, install the package:

```
@leadtributor/n8n-nodes-leadtributor
```

## Operations

The node exposes the following resources and operations.

### Lead

| Operation | Description |
|-----------|-------------|
| Assign to Sales Partner | Directly assign a lead to a sales partner |
| Create | Create a new lead |
| Get | Get a lead by ID |
| Get Duplicates | Get potential duplicate candidates for a lead |
| Get Many | List leads with optional filters |
| Update | Update the field lists of a lead |

For **Create** and **Update**, the input can be provided in two modes:

- **Form Mapper** — pick fields dynamically from a leadtributor form (recommended for visual mapping in n8n)
- **Raw JSON** — provide prospect/interest fields as a raw JSON object (advanced)

### Form

| Operation | Description |
|-----------|-------------|
| Get Many | List all forms defined by your company |

### Sales Partner

| Operation | Description |
|-----------|-------------|
| Get | Get a sales partner by ID |
| Get Many | List sales partners |
| Invite | Send an email invitation to a potential sales partner |
| Update | Update tags and attributes of a sales partner |
| End | End an active sales partner relationship |
| Delete | Delete a sales partner (only allowed when ENDED, PENDING or DECLINED) |

### Note

| Operation | Description |
|-----------|-------------|
| Add to Lead | Add a note to a lead |
| Get Many | List notes across all leads |
| Get Many for Lead | List notes of a specific lead |

### Market

| Operation | Description |
|-----------|-------------|
| Offer Lead | Offer a lead on a market for distribution to sales partners |

### Webhook

| Operation | Description |
|-----------|-------------|
| Subscribe | Subscribe to a webhook event |
| Unsubscribe | Unsubscribe from a webhook event by hook ID |

## Credentials

To use this node, you need a **leadtributor API Key**:

1. Log in to your [leadtributor.cloud](https://leadtributor.cloud) account.
2. Navigate to your account settings and generate an API Key.
3. In n8n, add new credentials of type **Leadtributor API**.
4. Enter your API Key and (optionally) override the base URL.

| Field    | Description                                                                  | Default                          |
|----------|------------------------------------------------------------------------------|----------------------------------|
| API Key  | Your leadtributor API Key. Sent as the value of the `Authorization` header.  | –                                |
| Base URL | Base URL of the leadtributor API. Use `https://api.demo.leadtributor.cloud` for the demo environment. | `https://api.leadtributor.cloud` |

The credential includes a built-in connection test against `GET /test`.

## Compatibility

- Requires **n8n 1.0** or later.
- Tested against **n8n 1.x**.
- Requires **Node.js 20** or later.

## Usage

A typical lead-intake workflow:

1. **Trigger** — receive a lead from a website form, CRM, or messaging channel.
2. **leadtributor — Lead → Create** — create the lead in leadtributor using the Form Mapper to map your incoming fields to a form.
3. *(Optional)* **leadtributor — Market → Offer Lead** — offer the new lead on a market for sales-partner distribution.
4. *(Optional)* **leadtributor — Note → Add to Lead** — attach context, source attribution, or follow-up info as a note.

For real-time integrations, use **Webhook → Subscribe** to receive lead status changes directly into n8n.

### AI Agent compatible

This node can be used as a tool by n8n's [AI Agent](https://docs.n8n.io/advanced-ai/examples/agent-chat/). The agent can autonomously decide which leadtributor operation to call based on the conversation context — for example, creating a lead from a chat message or looking up potential duplicates before deduplication.

See the [leadtributor API reference](https://developer.leadtributor.cloud) for the full schema of each resource.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [leadtributor.cloud](https://leadtributor.cloud)
- [leadtributor API documentation](https://developer.leadtributor.cloud)

## License

[MIT](LICENSE)
