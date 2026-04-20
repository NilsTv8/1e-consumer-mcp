/**
 * MCP Tool Definitions — 1E Platform Consumer API
 *
 * Generated from:
 *   https://1edev.dev.preprod.1e.com/consumer/swagger/v1/swagger.json
 *
 * Controllers covered:
 *   ApplicableOperations · Approvals · AuditLogs · Authentication
 *   CachedUserGroupMemberships · CachedUsers · Certificates
 *   Consumers · CustomProperties · CustomPropertyTypes
 */

import { OneEConsumerClient } from "./client.js";

export type McpContent =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string };

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (
    args: Record<string, unknown>,
    client: OneEConsumerClient
  ) => Promise<McpContent[]>;
}

function ok(data: unknown): McpContent[] {
  return [{ type: "text", text: JSON.stringify(data, null, 2) }];
}
function str(v: unknown): string { return String(v); }
function num(v: unknown): number { return Number(v); }

const idPathSchema = {
  type: "object",
  properties: { id: { type: "integer", description: "Integer ID" } },
  required: ["id"],
};

const searchPostSchema = {
  type: "object",
  description: "Filter / sort / paginate parameters",
  properties: {
    filter:    { type: "string",  description: "OData-style filter, e.g. \"Name eq 'X'\"" },
    sortBy:    { type: "string",  description: "Column to sort by" },
    sortOrder: { type: "string",  enum: ["asc", "desc"] },
    skip:      { type: "integer", description: "Records to skip" },
    take:      { type: "integer", description: "Records to return" },
  },
};

const tools: ToolDefinition[] = [

  // ── APPLICABLE OPERATIONS ─────────────────────────────────────────────

  {
    name: "applicable_operations_get_by_type_id",
    description: "Returns all operations applicable to a securable type (by numeric ID). Requires 'Read' on 'Security'.",
    inputSchema: {
      type: "object",
      properties: { securableTypeId: { type: "integer", description: "Securable type ID" } },
      required: ["securableTypeId"],
    },
    async handler(args, client) {
      return ok((await client.get(`/ApplicableOperations/SecurableTypeId/${num(args.securableTypeId)}`)).data);
    },
  },

  {
    name: "applicable_operations_get_by_type_name",
    description: "Returns all operations applicable to a securable type (by name). Requires 'Read' on 'Security'.",
    inputSchema: {
      type: "object",
      properties: { securableTypeName: { type: "string", description: "Securable type name" } },
      required: ["securableTypeName"],
    },
    async handler(args, client) {
      return ok((await client.get(`/ApplicableOperations/SecurableTypeName/${encodeURIComponent(str(args.securableTypeName))}`)).data);
    },
  },

  {
    name: "applicable_operations_add",
    description: "Add a new Applicable Operation. Provide securableTypeId OR securableTypeName (not both). Names must be unique per type. Requires 'Security' permission on 'Security'.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        securableTypeId:   { type: "integer" },
        securableTypeName: { type: "string"  },
      },
      required: ["name"],
    },
    async handler(args, client) {
      return ok((await client.post("/ApplicableOperations", args)).data);
    },
  },

  {
    name: "applicable_operations_delete",
    description: "Delete an Applicable Operation by ID. Fails if it has permissions attached. Requires 'Write' on 'Security'.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.delete(`/ApplicableOperations/${num(args.id)}`)).data);
    },
  },

  // ── APPROVALS ─────────────────────────────────────────────────────────

  {
    name: "approvals_approve_instruction",
    description: "Approve or reject an Instruction. Users cannot approve their own instructions. Requires 'Approve' on the Instruction Definition.",
    inputSchema: {
      type: "object",
      properties: {
        instructionId: { type: "integer" },
        approved:      { type: "boolean", description: "true = approve, false = reject" },
        comment:       { type: "string"  },
      },
      required: ["instructionId", "approved"],
    },
    async handler(args, client) {
      return ok((await client.post("/Approvals/Instruction", args)).data);
    },
  },

  {
    name: "approvals_approve_scheduled_instruction",
    description: "Approve or reject a Scheduled Instruction. Requires 'Approve' on the Instruction Definition.",
    inputSchema: {
      type: "object",
      properties: {
        scheduledInstructionId: { type: "integer" },
        approved: { type: "boolean" },
        comment:  { type: "string"  },
      },
      required: ["scheduledInstructionId", "approved"],
    },
    async handler(args, client) {
      return ok((await client.post("/Approvals/ScheduledInstruction", args)).data);
    },
  },

  {
    name: "approvals_approve_persistent_instruction",
    description: "Approve or reject a Persistent Instruction (API v26.2+). Requires 'Approve' on the Instruction Definition.",
    inputSchema: {
      type: "object",
      properties: {
        persistentInstructionId: { type: "integer" },
        approved: { type: "boolean" },
        comment:  { type: "string"  },
      },
      required: ["persistentInstructionId", "approved"],
    },
    async handler(args, client) {
      return ok((await client.post("/Approvals/PersistentInstruction", args)).data);
    },
  },

  {
    name: "approvals_can_approve_instruction",
    description: "Check whether the calling user can approve the given Instruction.",
    inputSchema: {
      type: "object",
      properties: { instructionId: { type: "integer" } },
      required: ["instructionId"],
    },
    async handler(args, client) {
      return ok((await client.get(`/Approvals/canapprove/instruction/${num(args.instructionId)}`)).data);
    },
  },

  {
    name: "approvals_can_approve_scheduled_instruction",
    description: "Check whether the calling user can approve the given Scheduled Instruction.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "integer", description: "Scheduled Instruction ID" } },
      required: ["id"],
    },
    async handler(args, client) {
      return ok((await client.get(`/Approvals/canapprove/scheduledinstruction/${num(args.id)}`)).data);
    },
  },

  {
    name: "approvals_can_approve_persistent_instruction",
    description: "Check whether the calling user can approve the given Persistent Instruction (API v26.2+).",
    inputSchema: {
      type: "object",
      properties: { id: { type: "integer", description: "Persistent Instruction ID" } },
      required: ["id"],
    },
    async handler(args, client) {
      return ok((await client.get(`/Approvals/canapprove/persistentinstruction/${num(args.id)}`)).data);
    },
  },

  {
    name: "approvals_get_pending_instructions",
    description: "Returns all Instructions pending approval that the calling user can approve.",
    inputSchema: { type: "object", properties: {} },
    async handler(_args, client) {
      return ok((await client.get("/Approvals/notifications/instructions")).data);
    },
  },

  {
    name: "approvals_get_pending_scheduled_instructions",
    description: "Returns all Scheduled Instructions pending approval that the calling user can approve.",
    inputSchema: { type: "object", properties: {} },
    async handler(_args, client) {
      return ok((await client.get("/Approvals/notifications/scheduledinstructions")).data);
    },
  },

  {
    name: "approvals_get_pending_persistent_instructions",
    description: "Returns all Persistent Instructions pending approval that the calling user can approve (API v26.2+).",
    inputSchema: { type: "object", properties: {} },
    async handler(_args, client) {
      return ok((await client.get("/Approvals/notifications/persistentinstructions")).data);
    },
  },

  {
    name: "approvals_get_all_pending",
    description: "Returns all pending approval requests (Instructions, Scheduled Instructions, Device Authorizations) the calling user can action.",
    inputSchema: { type: "object", properties: {} },
    async handler(_args, client) {
      return ok((await client.get("/Approvals/notifications")).data);
    },
  },

  // ── AUDIT LOGS ────────────────────────────────────────────────────────

  {
    name: "audit_logs_search",
    description: "Search audit logs. Filterable/sortable by: Component, Comment, CreatedTime, Message, UserName, DetailMessage. Requires 'Read' on 'Security'.",
    inputSchema: searchPostSchema,
    async handler(args, client) {
      return ok((await client.post("/AuditLogs", args)).data);
    },
  },

  {
    name: "audit_logs_add",
    description: "Add one or more audit log entries (API v24.9+).",
    inputSchema: {
      type: "object",
      properties: {
        entries: {
          type: "array",
          items: {
            type: "object",
            properties: {
              component:     { type: "string" },
              message:       { type: "string" },
              detailMessage: { type: "string" },
              comment:       { type: "string" },
            },
          },
        },
      },
      required: ["entries"],
    },
    async handler(args, client) {
      return ok((await client.post("/AuditLogs/Add", args.entries)).data);
    },
  },

  // ── AUTHENTICATION ────────────────────────────────────────────────────

  {
    name: "authentication_authenticate_instruction",
    description: "Submit a one-time token for Instruction Two-Factor Authentication. Only the instruction creator can call this.",
    inputSchema: {
      type: "object",
      properties: {
        instructionId: { type: "integer" },
        token:         { type: "string", description: "One-time token" },
      },
      required: ["instructionId", "token"],
    },
    async handler(args, client) {
      return ok((await client.post("/Authentication/Instruction/Token", args)).data);
    },
  },

  {
    name: "authentication_authenticate_scheduled_instruction",
    description: "Submit a one-time token for Scheduled Instruction Two-Factor Authentication. Only the creator can call this.",
    inputSchema: {
      type: "object",
      properties: {
        scheduledInstructionId: { type: "integer" },
        token: { type: "string" },
      },
      required: ["scheduledInstructionId", "token"],
    },
    async handler(args, client) {
      return ok((await client.post("/Authentication/ScheduledInstruction/Token", args)).data);
    },
  },

  // ── CACHED USER GROUP MEMBERSHIPS ─────────────────────────────────────

  {
    name: "cached_user_group_memberships_get",
    description: "Get the membership record for a specific user+group pair. Requires 'Read' on 'Security'.",
    inputSchema: {
      type: "object",
      properties: {
        userId:  { type: "integer" },
        groupId: { type: "integer" },
      },
      required: ["userId", "groupId"],
    },
    async handler(args, client) {
      return ok((await client.get(`/CachedUserGroupMemberships/${num(args.userId)}/${num(args.groupId)}`)).data);
    },
  },

  {
    name: "cached_user_group_memberships_add",
    description: "Create a new user–group membership. Requires 'Write' on 'Security'.",
    inputSchema: {
      type: "object",
      properties: {
        userId:  { type: "integer" },
        groupId: { type: "integer" },
      },
      required: ["userId", "groupId"],
    },
    async handler(args, client) {
      return ok((await client.post("/CachedUserGroupMemberships", args)).data);
    },
  },

  {
    name: "cached_user_group_memberships_delete",
    description: "Remove the membership between a user and a group. Requires 'Delete' on 'Security'.",
    inputSchema: {
      type: "object",
      properties: {
        userId:  { type: "integer" },
        groupId: { type: "integer" },
      },
      required: ["userId", "groupId"],
    },
    async handler(args, client) {
      return ok((await client.delete(`/CachedUserGroupMemberships/${num(args.userId)}/${num(args.groupId)}`)).data);
    },
  },

  {
    name: "cached_user_group_memberships_get_groups_for_user",
    description: "Get all group IDs a user belongs to. Requires 'Read' on 'Security'.",
    inputSchema: {
      type: "object",
      properties: { userId: { type: "integer" } },
      required: ["userId"],
    },
    async handler(args, client) {
      return ok((await client.get(`/CachedUserGroupMemberships/users/${num(args.userId)}/groups`)).data);
    },
  },

  {
    name: "cached_user_group_memberships_add_groups_for_user",
    description: "Batch-add a user to multiple groups (skips existing memberships). Requires 'Write' on 'Security'.",
    inputSchema: {
      type: "object",
      properties: {
        userId:   { type: "integer" },
        groupIds: { type: "array", items: { type: "integer" } },
      },
      required: ["userId", "groupIds"],
    },
    async handler(args, client) {
      return ok((await client.post(`/CachedUserGroupMemberships/users/${num(args.userId)}/groups`, args.groupIds)).data);
    },
  },

  {
    name: "cached_user_group_memberships_remove_groups_for_user",
    description: "Batch-remove a user from multiple groups (skips non-existent memberships). Requires 'Delete' on 'Security'.",
    inputSchema: {
      type: "object",
      properties: {
        userId:   { type: "integer" },
        groupIds: { type: "array", items: { type: "integer" } },
      },
      required: ["userId", "groupIds"],
    },
    async handler(args, client) {
      return ok((await client.request("DELETE", `/CachedUserGroupMemberships/users/${num(args.userId)}/groups`, { body: args.groupIds })).data);
    },
  },

  {
    name: "cached_user_group_memberships_get_users_in_group",
    description: "Get all user IDs that are members of a specific group. Requires 'Read' on 'Security'.",
    inputSchema: {
      type: "object",
      properties: { groupId: { type: "integer" } },
      required: ["groupId"],
    },
    async handler(args, client) {
      return ok((await client.get(`/CachedUserGroupMemberships/groups/${num(args.groupId)}/users`)).data);
    },
  },

  // ── CACHED USERS ──────────────────────────────────────────────────────

  {
    name: "cached_users_list",
    description: "List all cached users with optional skip/take pagination.",
    inputSchema: {
      type: "object",
      properties: {
        skip: { type: "integer", description: "Records to skip (default 0)"   },
        take: { type: "integer", description: "Records to return (default 100)" },
      },
    },
    async handler(args, client) {
      return ok((await client.get("/CachedUsers", { skip: args.skip as number, take: args.take as number })).data);
    },
  },

  {
    name: "cached_users_get_by_id",
    description: "Get a cached user by their integer ID.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.get(`/CachedUsers/${num(args.id)}`)).data);
    },
  },

  {
    name: "cached_users_add",
    description: "Create a new cached user.",
    inputSchema: {
      type: "object",
      properties: {
        username:    { type: "string" },
        displayName: { type: "string" },
        email:       { type: "string" },
      },
      required: ["username"],
    },
    async handler(args, client) {
      return ok((await client.post("/CachedUsers", args)).data);
    },
  },

  {
    name: "cached_users_update",
    description: "Update a cached user. The body must include the user's ID.",
    inputSchema: {
      type: "object",
      properties: {
        id:          { type: "integer" },
        username:    { type: "string"  },
        displayName: { type: "string"  },
        email:       { type: "string"  },
      },
      required: ["id"],
    },
    async handler(args, client) {
      return ok((await client.put("/CachedUsers", args)).data);
    },
  },

  {
    name: "cached_users_delete",
    description: "Delete a cached user by their integer ID.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.delete(`/CachedUsers/${num(args.id)}`)).data);
    },
  },

  // ── CERTIFICATES ──────────────────────────────────────────────────────

  {
    name: "certificates_list_idp",
    description: "List all available IdP certificates. Requires 'Read' on 'Infrastructure'.",
    inputSchema: { type: "object", properties: {} },
    async handler(_args, client) {
      return ok((await client.get("/Certificates/IdP")).data);
    },
  },

  {
    name: "certificates_download_idp",
    description: "Download a PEM-formatted IdP certificate by its thumbprint. Requires 'Read' on 'Infrastructure'.",
    inputSchema: {
      type: "object",
      properties: { thumbprint: { type: "string" } },
      required: ["thumbprint"],
    },
    async handler(args, client) {
      return ok((await client.get(`/Certificates/IdP/${encodeURIComponent(str(args.thumbprint))}/Download`)).data);
    },
  },

  {
    name: "certificates_set_active_idp",
    description: "Set the active IdP certificate by thumbprint. Requires 'Write' on 'Infrastructure'.",
    inputSchema: {
      type: "object",
      properties: { thumbprint: { type: "string" } },
      required: ["thumbprint"],
    },
    async handler(args, client) {
      return ok((await client.put(`/Certificates/IdP/${encodeURIComponent(str(args.thumbprint))}/Active`)).data);
    },
  },

  {
    name: "certificates_verify_idp",
    description: "Verify whether a certificate (by thumbprint) can be used for IdP communication. Requires 'Write' on 'Infrastructure'.",
    inputSchema: {
      type: "object",
      properties: { thumbprint: { type: "string" } },
      required: ["thumbprint"],
    },
    async handler(args, client) {
      return ok((await client.get(`/Certificates/IdP/${encodeURIComponent(str(args.thumbprint))}/Verify`)).data);
    },
  },

  // ── CONSUMERS ─────────────────────────────────────────────────────────

  {
    name: "consumers_list",
    description: "Return all Consumers. Requires 'Read' on 'Consumer'.",
    inputSchema: { type: "object", properties: {} },
    async handler(_args, client) {
      return ok((await client.get("/Consumers")).data);
    },
  },

  {
    name: "consumers_get_by_id",
    description: "Return a single Consumer by integer ID. Requires 'Read' on 'Consumer'.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "integer", description: "Consumer ID" } },
      required: ["id"],
    },
    async handler(args, client) {
      return ok((await client.get(`/Consumers/Id/${num(args.id)}`)).data);
    },
  },

  {
    name: "consumers_get_by_name",
    description: "Return a single Consumer by name (Base64-encoded automatically). Requires 'Read' on 'Consumer'.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "Consumer name (plain text)" } },
      required: ["name"],
    },
    async handler(args, client) {
      const encoded = Buffer.from(str(args.name)).toString("base64");
      return ok((await client.get(`/Consumers/Name/${encoded}`)).data);
    },
  },

  {
    name: "consumers_search",
    description: "Search Consumers. Filterable/sortable by: Name, Enabled, MaximumSimultaneousInstructions, OffloadTargetUrl, SystemConsumer. Requires 'Read' on 'Consumer'.",
    inputSchema: searchPostSchema,
    async handler(args, client) {
      return ok((await client.post("/Consumers/Search", args)).data);
    },
  },

  {
    name: "consumers_add",
    description: "Create a Consumer. Name must be alphanumeric+underscore only, unique. System consumers cannot be created. Requires 'Write' on 'Consumer'.",
    inputSchema: {
      type: "object",
      properties: {
        name:                                   { type: "string"  },
        isEnabled:                              { type: "boolean" },
        maximumSimultaneousInFlightInstructions:{ type: "integer" },
        offloadTargetUrl:                       { type: "string"  },
        offloadPostTimeoutSeconds:              { type: "integer" },
        offloadUseWindowsAuth:                  { type: "boolean" },
        applicationUrl:                         { type: "string"  },
        instructionHandlerUrl:                  { type: "string"  },
      },
      required: ["name", "maximumSimultaneousInFlightInstructions"],
    },
    async handler(args, client) {
      return ok((await client.post("/Consumers", args)).data);
    },
  },

  {
    name: "consumers_update",
    description: "Update an existing Consumer. System consumers cannot be renamed or disabled. Requires 'Write' on 'Consumer'.",
    inputSchema: {
      type: "object",
      properties: {
        id:                                     { type: "integer" },
        name:                                   { type: "string"  },
        isEnabled:                              { type: "boolean" },
        maximumSimultaneousInFlightInstructions:{ type: "integer" },
        offloadTargetUrl:                       { type: "string"  },
        offloadPostTimeoutSeconds:              { type: "integer" },
        offloadUseWindowsAuth:                  { type: "boolean" },
        applicationUrl:                         { type: "string"  },
        instructionHandlerUrl:                  { type: "string"  },
      },
      required: ["id"],
    },
    async handler(args, client) {
      return ok((await client.put("/Consumers", args)).data);
    },
  },

  {
    name: "consumers_delete",
    description: "Delete a Consumer by ID. System consumers and those used by scheduled instructions cannot be deleted. Requires 'Write' on 'Consumer'.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "integer" } },
      required: ["id"],
    },
    async handler(args, client) {
      return ok((await client.delete(`/Consumers/${num(args.id)}`)).data);
    },
  },

  {
    name: "consumers_delete_many",
    description: "Delete multiple Consumers by their IDs in one request. Requires 'Write' on 'Consumer'.",
    inputSchema: {
      type: "object",
      properties: {
        ids: { type: "array", items: { type: "integer" }, description: "Consumer IDs to delete" },
      },
      required: ["ids"],
    },
    async handler(args, client) {
      return ok((await client.request("DELETE", "/Consumers", { body: args.ids })).data);
    },
  },

  {
    name: "consumers_refresh_cache",
    description: "Force a refresh of the internal Consumers cache.",
    inputSchema: { type: "object", properties: {} },
    async handler(_args, client) {
      return ok((await client.put("/Consumers/refresh")).data);
    },
  },

  // ── CUSTOM PROPERTIES ─────────────────────────────────────────────────

  {
    name: "custom_properties_get_by_type_id",
    description: "Return all Custom Properties for a given type ID.",
    inputSchema: {
      type: "object",
      properties: { typeId: { type: "integer" } },
      required: ["typeId"],
    },
    async handler(args, client) {
      return ok((await client.get(`/CustomProperties/TypeId/${num(args.typeId)}`)).data);
    },
  },

  {
    name: "custom_properties_get_by_type_name",
    description: "Return all Custom Properties for a given type name.",
    inputSchema: {
      type: "object",
      properties: { typeName: { type: "string" } },
      required: ["typeName"],
    },
    async handler(args, client) {
      return ok((await client.get(`/CustomProperties/TypeName/${encodeURIComponent(str(args.typeName))}`)).data);
    },
  },

  {
    name: "custom_properties_get_by_id",
    description: "Return a single Custom Property by its ID.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.get(`/CustomProperties/Id/${num(args.id)}`)).data);
    },
  },

  {
    name: "custom_properties_search",
    description: "Search Custom Properties. Filterable/sortable by: Name, TypeName.",
    inputSchema: searchPostSchema,
    async handler(args, client) {
      return ok((await client.post("/CustomProperties/Search", args)).data);
    },
  },

  {
    name: "custom_properties_add",
    description: "Create a Custom Property with optional values. Provide typeId OR typeName. Name: unique, ≤16 chars, no spaces. Values: unique, ≤32 chars each. Requires 'Write' on 'CustomProperty'.",
    inputSchema: {
      type: "object",
      properties: {
        name:     { type: "string"  },
        typeId:   { type: "integer" },
        typeName: { type: "string"  },
        values: {
          type: "array",
          items: {
            type: "object",
            properties: { value: { type: "string" } },
            required: ["value"],
          },
        },
      },
      required: ["name"],
    },
    async handler(args, client) {
      return ok((await client.post("/CustomProperties", args)).data);
    },
  },

  {
    name: "custom_properties_update",
    description: "Update a Custom Property. values=null → unchanged; values=[] → removes all values. Requires 'Write' on 'CustomProperty'.",
    inputSchema: {
      type: "object",
      properties: {
        id:       { type: "integer" },
        name:     { type: "string"  },
        typeId:   { type: "integer" },
        typeName: { type: "string"  },
        values: {
          type: "array",
          nullable: true,
          items: {
            type: "object",
            properties: {
              id:    { type: "integer" },
              value: { type: "string"  },
            },
          },
        },
      },
      required: ["id"],
    },
    async handler(args, client) {
      return ok((await client.put("/CustomProperties", args)).data);
    },
  },

  {
    name: "custom_properties_delete",
    description: "Delete a single Custom Property by ID. Requires 'Write' on 'CustomProperty'.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.delete(`/CustomProperties/${num(args.id)}`)).data);
    },
  },

  {
    name: "custom_properties_delete_many",
    description: "Delete multiple Custom Properties by their IDs. Requires 'Write' on 'CustomProperty'.",
    inputSchema: {
      type: "object",
      properties: {
        ids: { type: "array", items: { type: "integer" } },
      },
      required: ["ids"],
    },
    async handler(args, client) {
      return ok((await client.request("DELETE", "/CustomProperties", { body: args.ids })).data);
    },
  },

  // ── CUSTOM PROPERTY TYPES ─────────────────────────────────────────────

  {
    name: "custom_property_types_list",
    description: "Return all available Custom Property Types.",
    inputSchema: { type: "object", properties: {} },
    async handler(_args, client) {
      return ok((await client.get("/CustomPropertyTypes")).data);
    },
  },

  {
    name: "custom_property_types_add",
    description: "Create a new Custom Property Type. Name: unique, ≤32 chars. System types cannot be created. Requires 'Write' on 'CustomProperty'.",
    inputSchema: {
      type: "object",
      properties: {
        name:        { type: "string", description: "Type name (max 32 chars, unique)" },
        description: { type: "string", description: "Optional description (max 512 chars)" },
      },
      required: ["name"],
    },
    async handler(args, client) {
      return ok((await client.post("/CustomPropertyTypes", args)).data);
    },
  },

  // ── DEVICES ───────────────────────────────────────────────────────────

  {
    name: "devices_list",
    description: "List all registered devices/agents known to the 1E platform.",
    inputSchema: { type: "object", properties: {} },
    async handler(_args, client) {
      return ok((await client.get("/Devices")).data);
    },
  },

  {
    name: "devices_search",
    description: "Search devices with filter/sort/pagination. Body is a SearchPostModel: start (integer offset), pageSize, sort array. includeInherited=true includes devices from child management groups.",
    inputSchema: {
      type: "object",
      properties: {
        includeInherited: { type: "boolean", description: "Include devices from child management groups (default false)" },
        start:    { type: "integer", description: "Offset for pagination" },
        pageSize: { type: "integer", description: "Number of results to return" },
        sort: {
          type: "array",
          description: "Sort specs, e.g. [{\"property\":\"Fqdn\",\"direction\":\"asc\"}]",
          items: {
            type: "object",
            properties: {
              property:  { type: "string" },
              direction: { type: "string", enum: ["asc", "desc"] },
            },
          },
        },
      },
    },
    async handler(args, client) {
      const includeInherited = args.includeInherited ?? false;
      const body = { start: args.start, pageSize: args.pageSize, sort: args.sort };
      return ok((await client.post(`/Devices/${includeInherited}`, body)).data);
    },
  },

  {
    name: "devices_get_by_fqdn",
    description: "Get a single device by its fully-qualified domain name (FQDN), e.g. 'hostname.domain.com'.",
    inputSchema: {
      type: "object",
      properties: { fqdn: { type: "string", description: "Device FQDN" } },
      required: ["fqdn"],
    },
    async handler(args, client) {
      return ok((await client.get(`/Devices/fqdn/${encodeURIComponent(str(args.fqdn))}`)).data);
    },
  },

  {
    name: "devices_get_by_tachyon_guid",
    description: "Get a single device by its Tachyon GUID (the unique identifier assigned by the 1E agent).",
    inputSchema: {
      type: "object",
      properties: { guid: { type: "string", description: "Tachyon GUID of the device" } },
      required: ["guid"],
    },
    async handler(args, client) {
      return ok((await client.get(`/Devices/tachyonguid/${encodeURIComponent(str(args.guid))}`)).data);
    },
  },

  {
    name: "devices_get_management_groups_by_fqdn",
    description: "Get the Management Groups that a device (identified by FQDN) belongs to.",
    inputSchema: {
      type: "object",
      properties: { fqdn: { type: "string" } },
      required: ["fqdn"],
    },
    async handler(args, client) {
      return ok((await client.get(`/Devices/fqdn/${encodeURIComponent(str(args.fqdn))}/ManagementGroups`)).data);
    },
  },

  {
    name: "devices_summary",
    description: "Get a summary count/status of devices matching an optional filter.",
    inputSchema: {
      type: "object",
      properties: {
        start:    { type: "integer" },
        pageSize: { type: "integer" },
      },
    },
    async handler(args, client) {
      return ok((await client.post("/Devices/summary", args)).data);
    },
  },

  // ── MANAGEMENT GROUPS (device groups) ────────────────────────────────

  {
    name: "management_groups_list",
    description: "List all Management Groups (device groups). These are used to scope instructions to sets of devices.",
    inputSchema: {
      type: "object",
      properties: {
        includeSystemGroups: { type: "boolean", description: "Include built-in system groups (default false)" },
      },
    },
    async handler(args, client) {
      return ok((await client.get("/ManagementGroups", { includeSystemGroups: args.includeSystemGroups as boolean })).data);
    },
  },

  {
    name: "management_groups_get_by_id",
    description: "Get a Management Group by integer ID.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.get(`/ManagementGroups/Id/${num(args.id)}`)).data);
    },
  },

  {
    name: "management_groups_get_by_name",
    description: "Get a Management Group by name.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    },
    async handler(args, client) {
      return ok((await client.get(`/ManagementGroups/Name/${encodeURIComponent(str(args.name))}`)).data);
    },
  },

  {
    name: "management_groups_search",
    description: "Search Management Groups with filter/sort/pagination.",
    inputSchema: {
      type: "object",
      properties: {
        start:    { type: "integer" },
        pageSize: { type: "integer" },
        sort: {
          type: "array",
          items: { type: "object", properties: { property: { type: "string" }, direction: { type: "string" } } },
        },
      },
    },
    async handler(args, client) {
      return ok((await client.post("/ManagementGroups/Search", args)).data);
    },
  },

  {
    name: "management_groups_get_contents",
    description: "Get the devices that are members of a Management Group by its integer ID.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.get(`/ManagementGroups/Contents/Id/${num(args.id)}`)).data);
    },
  },

  {
    name: "management_groups_get_all_devices",
    description: "Get all devices across all Management Groups.",
    inputSchema: { type: "object", properties: {} },
    async handler(_args, client) {
      return ok((await client.get("/ManagementGroups/AllDevices")).data);
    },
  },

  // ── INSTRUCTION DEFINITIONS ───────────────────────────────────────────

  {
    name: "instruction_definitions_list",
    description: "List all available Instruction Definitions (the templates that describe what instructions can be sent to devices).",
    inputSchema: {
      type: "object",
      properties: {
        instructionType: { type: "string", description: "Optional filter by instruction type" },
      },
    },
    async handler(args, client) {
      return ok((await client.get("/InstructionDefinitions", { instructionType: args.instructionType as string })).data);
    },
  },

  {
    name: "instruction_definitions_get_by_id",
    description: "Get a single Instruction Definition by its integer ID. Returns full schema including parameters needed.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.get(`/InstructionDefinitions/Id/${num(args.id)}`)).data);
    },
  },

  {
    name: "instruction_definitions_get_by_name",
    description: "Get an Instruction Definition by its exact name. Use this to find the definitionId and parameter schema before sending an instruction.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    },
    async handler(args, client) {
      return ok((await client.get(`/InstructionDefinitions/Name/${encodeURIComponent(str(args.name))}`)).data);
    },
  },

  {
    name: "instruction_definitions_search",
    description: "Search Instruction Definitions with filter/sort/pagination.",
    inputSchema: {
      type: "object",
      properties: {
        start:    { type: "integer" },
        pageSize: { type: "integer" },
        sort: {
          type: "array",
          items: { type: "object", properties: { property: { type: "string" }, direction: { type: "string" } } },
        },
      },
    },
    async handler(args, client) {
      return ok((await client.post("/InstructionDefinitions/Search", args)).data);
    },
  },

  // ── INSTRUCTIONS ─────────────────────────────────────────────────────

  {
    name: "instructions_send",
    description: "Send an instruction to devices. Use definitionId or definitionName to identify the instruction template. Target devices via 'devices' (array of FQDNs like ['host.domain.com']) OR via 'scope' (management group expression). Parameters are passed as [{name, value}] pairs matching the definition's schema.",
    inputSchema: {
      type: "object",
      properties: {
        definitionId:   { type: "integer", description: "ID of the Instruction Definition" },
        definitionName: { type: "string",  description: "Name of the Instruction Definition (alternative to definitionId)" },
        devices: {
          type: "array",
          items: { type: "string" },
          description: "List of device FQDNs to target, e.g. ['host1.corp.com', 'host2.corp.com']. Cannot be combined with scope.",
        },
        parameters: {
          type: "array",
          description: "Instruction parameters as [{name, value}] pairs",
          items: {
            type: "object",
            properties: {
              name:  { type: "string" },
              value: { type: "string" },
            },
            required: ["name", "value"],
          },
        },
        instructionTtlMinutes: { type: "integer", description: "Minutes to gather responses (default varies by definition)" },
        responseTtlMinutes:    { type: "integer", description: "Minutes to keep responses after gathering ends" },
        comments:              { type: "string",  description: "Optional comment/reason" },
        keepRaw:               { type: "boolean", description: "Store raw agent responses" },
      },
    },
    async handler(args, client) {
      return ok((await client.post("/Instructions", args)).data);
    },
  },

  {
    name: "instructions_send_to_device",
    description: "Send an instruction directly to a single device identified by its Tachyon GUID. Simpler than instructions_send when you already know the device GUID.",
    inputSchema: {
      type: "object",
      properties: {
        guid:           { type: "string",  description: "Tachyon GUID of the target device" },
        definitionId:   { type: "integer", description: "Instruction Definition ID" },
        definitionName: { type: "string",  description: "Instruction Definition name (alternative to definitionId)" },
        parameters: {
          type: "array",
          items: { type: "object", properties: { name: { type: "string" }, value: { type: "string" } }, required: ["name", "value"] },
        },
        instructionTtlMinutes: { type: "integer" },
        responseTtlMinutes:    { type: "integer" },
        comments:              { type: "string" },
      },
      required: ["guid"],
    },
    async handler(args, client) {
      const { guid, ...body } = args;
      return ok((await client.post(`/Devices/tachyonguid/${encodeURIComponent(str(guid))}/Instruction`, body)).data);
    },
  },

  {
    name: "instructions_get_by_id",
    description: "Get an Instruction by its integer ID. Returns status, target info, parameters, and approval state.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.get(`/Instructions/${num(args.id)}`)).data);
    },
  },

  {
    name: "instructions_search",
    description: "Search Instructions with filter/sort/pagination.",
    inputSchema: {
      type: "object",
      properties: {
        start:    { type: "integer" },
        pageSize: { type: "integer" },
        sort: {
          type: "array",
          items: { type: "object", properties: { property: { type: "string" }, direction: { type: "string" } } },
        },
      },
    },
    async handler(args, client) {
      return ok((await client.post("/Instructions/search", args)).data);
    },
  },

  {
    name: "instructions_get_statistics",
    description: "Get execution statistics for an instruction: total devices targeted, how many responded, pending, errors.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.get(`/InstructionStatistics/Summary/${num(args.id)}`)).data);
    },
  },

  {
    name: "instructions_get_statistics_detail",
    description: "Get detailed per-state statistics for an instruction.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.get(`/InstructionStatistics/Detail/${num(args.id)}`)).data);
    },
  },

  {
    name: "instructions_get_responses",
    description: "Get the actual responses/results from devices for an instruction. local=true returns data stored locally. Supports pagination via start/pageSize.",
    inputSchema: {
      type: "object",
      properties: {
        instructionId: { type: "integer", description: "Instruction ID" },
        local:         { type: "boolean", description: "true = local data store, false = any (default false)" },
        start:         { type: "integer", description: "Pagination offset" },
        pageSize:      { type: "integer", description: "Results per page" },
      },
      required: ["instructionId"],
    },
    async handler(args, client) {
      const local = args.local ?? false;
      const body = { start: args.start, pageSize: args.pageSize };
      return ok((await client.post(`/Responses/${num(args.instructionId)}/${local}`, body)).data);
    },
  },

  {
    name: "instructions_get_responses_aggregate",
    description: "Get aggregated (grouped/counted) responses for an instruction — useful for survey-style instructions that return the same values from many devices.",
    inputSchema: {
      type: "object",
      properties: {
        instructionId: { type: "integer" },
        local:         { type: "boolean", description: "true = local data store (default false)" },
        pageSize:      { type: "integer" },
      },
      required: ["instructionId"],
    },
    async handler(args, client) {
      const local = args.local ?? false;
      const body = { pageSize: args.pageSize };
      return ok((await client.post(`/Responses/${num(args.instructionId)}/Aggregate/${local}`, body)).data);
    },
  },

  {
    name: "instructions_get_responding_devices",
    description: "Get the list of unique device FQDNs that have responded to an instruction.",
    inputSchema: {
      type: "object",
      properties: {
        instructionId: { type: "integer" },
        local:         { type: "boolean", description: "true = local data store (default false)" },
      },
      required: ["instructionId"],
    },
    async handler(args, client) {
      const local = args.local ?? false;
      return ok((await client.post(`/Responses/${num(args.instructionId)}/UniqueFQDNs/${local}`, {})).data);
    },
  },

  {
    name: "instructions_get_target_list",
    description: "Get the list of devices that were targeted by an instruction.",
    inputSchema: {
      type: "object",
      properties: { instructionId: { type: "integer" } },
      required: ["instructionId"],
    },
    async handler(args, client) {
      return ok((await client.get(`/Instructions/${num(args.instructionId)}/targetlist`)).data);
    },
  },

  {
    name: "instructions_cancel",
    description: "Cancel a running instruction. keepData=true retains any responses already collected; keepData=false deletes them.",
    inputSchema: {
      type: "object",
      properties: {
        id:       { type: "integer" },
        keepData: { type: "boolean", description: "Keep already-collected responses (default true)" },
      },
      required: ["id"],
    },
    async handler(args, client) {
      const keepData = args.keepData ?? true;
      return ok((await client.post(`/Instructions/${num(args.id)}/cancel/${keepData}`)).data);
    },
  },

  {
    name: "instructions_rerun",
    description: "Re-run a previously completed instruction with the same parameters and scope.",
    inputSchema: {
      type: "object",
      properties: { instructionId: { type: "integer" } },
      required: ["instructionId"],
    },
    async handler(args, client) {
      return ok((await client.post(`/Instructions/${num(args.instructionId)}/rerun`)).data);
    },
  },

  // ── SCHEDULED INSTRUCTIONS ────────────────────────────────────────────

  {
    name: "scheduled_instructions_create",
    description: "Schedule an instruction to run on a recurring schedule. Uses SQL Server Agent-style schedule fields: scheduleFreqType (1=once,4=daily,8=weekly,16=monthly), scheduleFreqInterval, scheduleActiveStartDate, scheduleActiveStartTime (HHMMSS as integer, e.g. 90000 = 09:00:00).",
    inputSchema: {
      type: "object",
      properties: {
        definitionId:   { type: "integer" },
        definitionName: { type: "string"  },
        devices: {
          type: "array", items: { type: "string" },
          description: "Target device FQDNs",
        },
        parameters: {
          type: "array",
          items: { type: "object", properties: { name: { type: "string" }, value: { type: "string" } }, required: ["name","value"] },
        },
        scheduleEnabled:              { type: "boolean" },
        scheduleFreqType:             { type: "integer", description: "1=once, 4=daily, 8=weekly, 16=monthly" },
        scheduleFreqInterval:         { type: "integer" },
        scheduleFreqSubdayType:       { type: "integer" },
        scheduleFreqSubdayInterval:   { type: "integer" },
        scheduleActiveStartDate:      { type: "string", description: "ISO 8601 date-time" },
        scheduleActiveEndDate:        { type: "string", description: "ISO 8601 date-time" },
        scheduleActiveStartTime:      { type: "integer", description: "Start time as HHMMSS integer, e.g. 90000 = 09:00:00" },
        scheduleActiveEndTime:        { type: "integer" },
        instructionTtlMinutes:        { type: "integer" },
        responseTtlMinutes:           { type: "integer" },
        comments:                     { type: "string"  },
      },
    },
    async handler(args, client) {
      return ok((await client.post("/ScheduledInstructions", args)).data);
    },
  },

  {
    name: "scheduled_instructions_get_by_id",
    description: "Get a Scheduled Instruction by integer ID.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.get(`/ScheduledInstructions/${num(args.id)}`)).data);
    },
  },

  {
    name: "scheduled_instructions_search",
    description: "Search Scheduled Instructions with filter/sort/pagination.",
    inputSchema: {
      type: "object",
      properties: {
        start:    { type: "integer" },
        pageSize: { type: "integer" },
        sort: { type: "array", items: { type: "object" } },
      },
    },
    async handler(args, client) {
      return ok((await client.post("/ScheduledInstructions/Search", args)).data);
    },
  },

  {
    name: "scheduled_instructions_update",
    description: "Update an existing Scheduled Instruction by ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer" },
        scheduleEnabled:         { type: "boolean" },
        scheduleFreqType:        { type: "integer" },
        scheduleFreqInterval:    { type: "integer" },
        scheduleActiveStartDate: { type: "string"  },
        scheduleActiveStartTime: { type: "integer" },
        parameters: { type: "array", items: { type: "object" } },
        comments:   { type: "string" },
      },
      required: ["id"],
    },
    async handler(args, client) {
      const { id, ...body } = args;
      return ok((await client.post(`/ScheduledInstructions/Update/${num(id)}`, body)).data);
    },
  },

  {
    name: "scheduled_instructions_cancel",
    description: "Cancel a Scheduled Instruction by integer ID.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.post(`/ScheduledInstructions/${num(args.id)}/cancel`)).data);
    },
  },

  {
    name: "scheduled_instructions_delete",
    description: "Delete a Scheduled Instruction by integer ID.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.delete(`/ScheduledInstructions/${num(args.id)}`)).data);
    },
  },

  // ── PERSISTENT INSTRUCTIONS ───────────────────────────────────────────

  {
    name: "persistent_instructions_create",
    description: "Create a Persistent Instruction that continuously applies to all current and future devices matching a scope.",
    inputSchema: {
      type: "object",
      properties: {
        definitionId:   { type: "integer" },
        definitionName: { type: "string"  },
        devices: { type: "array", items: { type: "string" }, description: "Target device FQDNs" },
        parameters: {
          type: "array",
          items: { type: "object", properties: { name: { type: "string" }, value: { type: "string" } }, required: ["name","value"] },
        },
        instructionTtlMinutes: { type: "integer" },
        responseTtlMinutes:    { type: "integer" },
        comments:              { type: "string"  },
      },
    },
    async handler(args, client) {
      return ok((await client.post("/PersistentInstructions", args)).data);
    },
  },

  {
    name: "persistent_instructions_get_by_id",
    description: "Get a Persistent Instruction by integer ID.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.get(`/PersistentInstructions/${num(args.id)}`)).data);
    },
  },

  {
    name: "persistent_instructions_search",
    description: "Search Persistent Instructions with filter/sort/pagination.",
    inputSchema: {
      type: "object",
      properties: {
        start:    { type: "integer" },
        pageSize: { type: "integer" },
        sort: { type: "array", items: { type: "object" } },
      },
    },
    async handler(args, client) {
      return ok((await client.post("/PersistentInstructions/search", args)).data);
    },
  },

  {
    name: "persistent_instructions_cancel",
    description: "Cancel a Persistent Instruction by integer ID.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.post(`/PersistentInstructions/${num(args.id)}/cancel`)).data);
    },
  },

  {
    name: "persistent_instructions_delete",
    description: "Delete a Persistent Instruction by integer ID.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.delete(`/PersistentInstructions/${num(args.id)}`)).data);
    },
  },

];

export default tools;
