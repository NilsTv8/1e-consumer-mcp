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
 *   Devices · InstructionDefinitions · Instructions
 *   ScheduledInstructions · PersistentInstructions
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
    description: "List managed devices with optional pagination. Returns device inventory from the 1E platform. Requires 'Read' on 'Device'.",
    inputSchema: {
      type: "object",
      properties: {
        skip: { type: "integer", description: "Records to skip (default 0)" },
        take: { type: "integer", description: "Records to return (default 100)" },
      },
    },
    async handler(args, client) {
      return ok((await client.get("/Devices", { skip: args.skip as number, take: args.take as number })).data);
    },
  },

  {
    name: "devices_get_by_id",
    description: "Get a single managed device by its integer ID. Returns full device details including name, FQDN, OS, last seen time, and custom properties. Requires 'Read' on 'Device'.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.get(`/Devices/${num(args.id)}`)).data);
    },
  },

  {
    name: "devices_search",
    description: "Search devices using OData-style filters. Filterable/sortable by: Name, Fqdn, OsName, OsVersion, LastSeen, IsOnline, Domain. Example filter: \"IsOnline eq true\". Requires 'Read' on 'Device'.",
    inputSchema: searchPostSchema,
    async handler(args, client) {
      return ok((await client.post("/Devices/Search", args)).data);
    },
  },

  {
    name: "devices_get_by_name",
    description: "Find a device by its hostname/computer name. Returns matching device details. Requires 'Read' on 'Device'.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "Device hostname or computer name" } },
      required: ["name"],
    },
    async handler(args, client) {
      return ok((await client.get(`/Devices/Name/${encodeURIComponent(str(args.name))}`)).data);
    },
  },

  {
    name: "devices_get_online_status",
    description: "Check whether a specific device is currently online/reachable. Requires 'Read' on 'Device'.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.get(`/Devices/${num(args.id)}/OnlineStatus`)).data);
    },
  },

  // ── INSTRUCTION DEFINITIONS ───────────────────────────────────────────

  {
    name: "instruction_definitions_list",
    description: "List all available Instruction Definitions (templates for instructions that can be sent to devices). Requires 'Read' on 'InstructionDefinition'.",
    inputSchema: {
      type: "object",
      properties: {
        skip: { type: "integer" },
        take: { type: "integer" },
      },
    },
    async handler(args, client) {
      return ok((await client.get("/InstructionDefinitions", { skip: args.skip as number, take: args.take as number })).data);
    },
  },

  {
    name: "instruction_definitions_get_by_id",
    description: "Get a single Instruction Definition by ID. Returns the full schema including parameters needed to send the instruction. Requires 'Read' on 'InstructionDefinition'.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.get(`/InstructionDefinitions/${num(args.id)}`)).data);
    },
  },

  {
    name: "instruction_definitions_get_by_name",
    description: "Get an Instruction Definition by its name. Useful to discover the parameter schema before sending an instruction. Requires 'Read' on 'InstructionDefinition'.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "Instruction Definition name" } },
      required: ["name"],
    },
    async handler(args, client) {
      return ok((await client.get(`/InstructionDefinitions/Name/${encodeURIComponent(str(args.name))}`)).data);
    },
  },

  {
    name: "instruction_definitions_search",
    description: "Search Instruction Definitions. Filterable/sortable by: Name, Description, Category, Enabled, RequiresApproval. Requires 'Read' on 'InstructionDefinition'.",
    inputSchema: searchPostSchema,
    async handler(args, client) {
      return ok((await client.post("/InstructionDefinitions/Search", args)).data);
    },
  },

  // ── INSTRUCTIONS (send & track actions on devices) ────────────────────

  {
    name: "instructions_send",
    description: "Send an instruction to one or more devices. This is the primary way to execute actions on managed devices. Provide the instructionDefinitionId and target device(s) via deviceIds or a deviceGroupId. Parameters for the instruction go in the 'parameters' object. Requires 'Execute' on the Instruction Definition.",
    inputSchema: {
      type: "object",
      properties: {
        instructionDefinitionId: { type: "integer", description: "ID of the Instruction Definition to execute" },
        deviceIds:   { type: "array",  items: { type: "integer" }, description: "List of device IDs to target" },
        deviceGroupId: { type: "integer", description: "Target all devices in this group (alternative to deviceIds)" },
        parameters:  { type: "object", description: "Key/value parameters required by the Instruction Definition", additionalProperties: true },
        comment:     { type: "string", description: "Optional comment/reason for the instruction" },
        consumerId:  { type: "integer", description: "Consumer ID (defaults to the system consumer if omitted)" },
      },
      required: ["instructionDefinitionId"],
    },
    async handler(args, client) {
      return ok((await client.post("/Instructions", args)).data);
    },
  },

  {
    name: "instructions_get_by_id",
    description: "Get an Instruction by its ID. Returns current status, target devices, parameters, and approval state. Requires 'Read' on 'Instruction'.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.get(`/Instructions/${num(args.id)}`)).data);
    },
  },

  {
    name: "instructions_search",
    description: "Search Instructions. Filterable/sortable by: Status, CreatedTime, CreatedByUserName, InstructionDefinitionName, Comment. Useful to monitor in-flight or completed instructions. Requires 'Read' on 'Instruction'.",
    inputSchema: searchPostSchema,
    async handler(args, client) {
      return ok((await client.post("/Instructions/Search", args)).data);
    },
  },

  {
    name: "instructions_get_results",
    description: "Get the execution results for an Instruction, broken down per device. Shows per-device status, output, and any error messages. Requires 'Read' on 'Instruction'.",
    inputSchema: {
      type: "object",
      properties: {
        id:   { type: "integer", description: "Instruction ID" },
        skip: { type: "integer" },
        take: { type: "integer" },
      },
      required: ["id"],
    },
    async handler(args, client) {
      return ok((await client.get(`/Instructions/${num(args.id)}/Results`, { skip: args.skip as number, take: args.take as number })).data);
    },
  },

  {
    name: "instructions_get_status",
    description: "Get a lightweight status summary for an Instruction (pending/running/completed/failed counts). Faster than fetching full results. Requires 'Read' on 'Instruction'.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.get(`/Instructions/${num(args.id)}/Status`)).data);
    },
  },

  {
    name: "instructions_cancel",
    description: "Cancel a pending or in-progress Instruction. Only the instruction creator or an admin can cancel. Requires 'Write' on 'Instruction'.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.put(`/Instructions/${num(args.id)}/Cancel`)).data);
    },
  },

  {
    name: "instructions_delete",
    description: "Delete an Instruction by ID. Only completed/cancelled instructions can be deleted. Requires 'Write' on 'Instruction'.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.delete(`/Instructions/${num(args.id)}`)).data);
    },
  },

  // ── SCHEDULED INSTRUCTIONS ────────────────────────────────────────────

  {
    name: "scheduled_instructions_create",
    description: "Schedule an instruction to run at a future date/time or on a recurring schedule. Provide a cron expression for recurring runs. Requires 'Execute' on the Instruction Definition.",
    inputSchema: {
      type: "object",
      properties: {
        instructionDefinitionId: { type: "integer" },
        deviceIds:    { type: "array", items: { type: "integer" } },
        deviceGroupId: { type: "integer" },
        parameters:   { type: "object", additionalProperties: true },
        scheduledTime: { type: "string", description: "ISO 8601 datetime for one-off execution, e.g. '2025-06-01T09:00:00Z'" },
        cronExpression: { type: "string", description: "Cron expression for recurring schedules, e.g. '0 9 * * 1' (every Monday at 09:00)" },
        comment:      { type: "string" },
        consumerId:   { type: "integer" },
      },
      required: ["instructionDefinitionId"],
    },
    async handler(args, client) {
      return ok((await client.post("/ScheduledInstructions", args)).data);
    },
  },

  {
    name: "scheduled_instructions_get_by_id",
    description: "Get a Scheduled Instruction by ID. Returns schedule details, approval state, and last run information. Requires 'Read' on 'Instruction'.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.get(`/ScheduledInstructions/${num(args.id)}`)).data);
    },
  },

  {
    name: "scheduled_instructions_search",
    description: "Search Scheduled Instructions. Filterable/sortable by: Status, ScheduledTime, CronExpression, InstructionDefinitionName, CreatedByUserName. Requires 'Read' on 'Instruction'.",
    inputSchema: searchPostSchema,
    async handler(args, client) {
      return ok((await client.post("/ScheduledInstructions/Search", args)).data);
    },
  },

  {
    name: "scheduled_instructions_update",
    description: "Update a Scheduled Instruction (e.g. change schedule time or parameters). Cannot update instructions that have already run. Requires 'Write' on 'Instruction'.",
    inputSchema: {
      type: "object",
      properties: {
        id:           { type: "integer" },
        scheduledTime: { type: "string" },
        cronExpression: { type: "string" },
        parameters:   { type: "object", additionalProperties: true },
        comment:      { type: "string" },
      },
      required: ["id"],
    },
    async handler(args, client) {
      return ok((await client.put("/ScheduledInstructions", args)).data);
    },
  },

  {
    name: "scheduled_instructions_delete",
    description: "Delete a Scheduled Instruction by ID. Requires 'Write' on 'Instruction'.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.delete(`/ScheduledInstructions/${num(args.id)}`)).data);
    },
  },

  {
    name: "scheduled_instructions_enable",
    description: "Enable a previously disabled Scheduled Instruction. Requires 'Write' on 'Instruction'.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.put(`/ScheduledInstructions/${num(args.id)}/Enable`)).data);
    },
  },

  {
    name: "scheduled_instructions_disable",
    description: "Disable a Scheduled Instruction without deleting it. Requires 'Write' on 'Instruction'.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.put(`/ScheduledInstructions/${num(args.id)}/Disable`)).data);
    },
  },

  // ── PERSISTENT INSTRUCTIONS (API v26.2+) ─────────────────────────────

  {
    name: "persistent_instructions_create",
    description: "Create a Persistent Instruction that continuously targets devices matching a scope (e.g. all devices in a group). The instruction re-executes when new devices join the scope. Requires 'Execute' on the Instruction Definition. API v26.2+.",
    inputSchema: {
      type: "object",
      properties: {
        instructionDefinitionId: { type: "integer" },
        deviceGroupId: { type: "integer", description: "Devices in this group will be persistently targeted" },
        parameters:    { type: "object", additionalProperties: true },
        comment:       { type: "string" },
        consumerId:    { type: "integer" },
      },
      required: ["instructionDefinitionId"],
    },
    async handler(args, client) {
      return ok((await client.post("/PersistentInstructions", args)).data);
    },
  },

  {
    name: "persistent_instructions_get_by_id",
    description: "Get a Persistent Instruction by ID. Returns scope, parameters, approval state, and execution history. Requires 'Read' on 'Instruction'. API v26.2+.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.get(`/PersistentInstructions/${num(args.id)}`)).data);
    },
  },

  {
    name: "persistent_instructions_search",
    description: "Search Persistent Instructions. Filterable/sortable by: Status, InstructionDefinitionName, CreatedByUserName, DeviceGroupId. Requires 'Read' on 'Instruction'. API v26.2+.",
    inputSchema: searchPostSchema,
    async handler(args, client) {
      return ok((await client.post("/PersistentInstructions/Search", args)).data);
    },
  },

  {
    name: "persistent_instructions_get_results",
    description: "Get per-device execution results for a Persistent Instruction. Requires 'Read' on 'Instruction'. API v26.2+.",
    inputSchema: {
      type: "object",
      properties: {
        id:   { type: "integer" },
        skip: { type: "integer" },
        take: { type: "integer" },
      },
      required: ["id"],
    },
    async handler(args, client) {
      return ok((await client.get(`/PersistentInstructions/${num(args.id)}/Results`, { skip: args.skip as number, take: args.take as number })).data);
    },
  },

  {
    name: "persistent_instructions_delete",
    description: "Delete a Persistent Instruction by ID. Stops future executions. Requires 'Write' on 'Instruction'. API v26.2+.",
    inputSchema: idPathSchema,
    async handler(args, client) {
      return ok((await client.delete(`/PersistentInstructions/${num(args.id)}`)).data);
    },
  },

];

export default tools;
