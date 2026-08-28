# Tool Overview — 1E Consumer API MCP Server

92 tools across 16 controller groups. Generated from `src/tools.ts`.

## Contents

- [Applicable Operations](#applicable-operations) (4)
- [Approvals](#approvals) (10)
- [Audit Logs](#audit-logs) (2)
- [Authentication](#authentication) (2)
- [Cached User Group Memberships](#cached-user-group-memberships) (7)
- [Cached Users](#cached-users) (5)
- [Certificates](#certificates) (4)
- [Consumers](#consumers) (9)
- [Custom Properties](#custom-properties) (8)
- [Custom Property Types](#custom-property-types) (2)
- [Devices](#devices) (6)
- [Management Groups (Device Groups)](#management-groups-device-groups) (6)
- [Instruction Definitions](#instruction-definitions) (4)
- [Instructions](#instructions) (12)
- [Scheduled Instructions](#scheduled-instructions) (6)
- [Persistent Instructions](#persistent-instructions) (5)

---

## Applicable Operations

| Tool | Description | Required params |
|---|---|---|
| `applicable_operations_get_by_type_id` | Returns all operations applicable to a securable type (by numeric ID). Requires 'Read' on 'Security'. | `securableTypeId` |
| `applicable_operations_get_by_type_name` | Returns all operations applicable to a securable type (by name). Requires 'Read' on 'Security'. | `securableTypeName` |
| `applicable_operations_add` | Add a new Applicable Operation. Provide securableTypeId OR securableTypeName (not both). Names must be unique per type. Requires 'Security' permission on 'Security'. | `name` |
| `applicable_operations_delete` | Delete an Applicable Operation by ID. Fails if it has permissions attached. Requires 'Write' on 'Security'. | `id` |

## Approvals

| Tool | Description | Required params |
|---|---|---|
| `approvals_approve_instruction` | Approve or reject an Instruction. Users cannot approve their own instructions. Requires 'Approve' on the Instruction Definition. | `instructionId`, `approved` |
| `approvals_approve_scheduled_instruction` | Approve or reject a Scheduled Instruction. Requires 'Approve' on the Instruction Definition. | `scheduledInstructionId`, `approved` |
| `approvals_approve_persistent_instruction` | Approve or reject a Persistent Instruction (API v26.2+). Requires 'Approve' on the Instruction Definition. | `persistentInstructionId`, `approved` |
| `approvals_can_approve_instruction` | Check whether the calling user can approve the given Instruction. | `instructionId` |
| `approvals_can_approve_scheduled_instruction` | Check whether the calling user can approve the given Scheduled Instruction. | `id` |
| `approvals_can_approve_persistent_instruction` | Check whether the calling user can approve the given Persistent Instruction (API v26.2+). | `id` |
| `approvals_get_pending_instructions` | Returns all Instructions pending approval that the calling user can approve. | — |
| `approvals_get_pending_scheduled_instructions` | Returns all Scheduled Instructions pending approval that the calling user can approve. | — |
| `approvals_get_pending_persistent_instructions` | Returns all Persistent Instructions pending approval that the calling user can approve (API v26.2+). | — |
| `approvals_get_all_pending` | Returns all pending approval requests (Instructions, Scheduled Instructions, Device Authorizations) the calling user can action. | — |

## Audit Logs

| Tool | Description | Required params |
|---|---|---|
| `audit_logs_search` | Search audit logs. Filterable/sortable by: Component, Comment, CreatedTime, Message, UserName, DetailMessage. Requires 'Read' on 'Security'. | — |
| `audit_logs_add` | Add one or more audit log entries (API v24.9+). | `entries` |

## Authentication

| Tool | Description | Required params |
|---|---|---|
| `authentication_authenticate_instruction` | Submit a one-time token for Instruction Two-Factor Authentication. Only the instruction creator can call this. | `instructionId`, `token` |
| `authentication_authenticate_scheduled_instruction` | Submit a one-time token for Scheduled Instruction Two-Factor Authentication. Only the creator can call this. | `scheduledInstructionId`, `token` |

## Cached User Group Memberships

| Tool | Description | Required params |
|---|---|---|
| `cached_user_group_memberships_get` | Get the membership record for a specific user+group pair. Requires 'Read' on 'Security'. | `userId`, `groupId` |
| `cached_user_group_memberships_add` | Create a new user–group membership. Requires 'Write' on 'Security'. | `userId`, `groupId` |
| `cached_user_group_memberships_delete` | Remove the membership between a user and a group. Requires 'Delete' on 'Security'. | `userId`, `groupId` |
| `cached_user_group_memberships_get_groups_for_user` | Get all group IDs a user belongs to. Requires 'Read' on 'Security'. | `userId` |
| `cached_user_group_memberships_add_groups_for_user` | Batch-add a user to multiple groups (skips existing memberships). Requires 'Write' on 'Security'. | `userId`, `groupIds` |
| `cached_user_group_memberships_remove_groups_for_user` | Batch-remove a user from multiple groups (skips non-existent memberships). Requires 'Delete' on 'Security'. | `userId`, `groupIds` |
| `cached_user_group_memberships_get_users_in_group` | Get all user IDs that are members of a specific group. Requires 'Read' on 'Security'. | `groupId` |

## Cached Users

| Tool | Description | Required params |
|---|---|---|
| `cached_users_list` | List all cached users with optional skip/take pagination. | — |
| `cached_users_get_by_id` | Get a cached user by their integer ID. | `id` |
| `cached_users_add` | Create a new cached user. | `username` |
| `cached_users_update` | Update a cached user. The body must include the user's ID. | `id` |
| `cached_users_delete` | Delete a cached user by their integer ID. | `id` |

## Certificates

| Tool | Description | Required params |
|---|---|---|
| `certificates_list_idp` | List all available IdP certificates. Requires 'Read' on 'Infrastructure'. | — |
| `certificates_download_idp` | Download a PEM-formatted IdP certificate by its thumbprint. Requires 'Read' on 'Infrastructure'. | `thumbprint` |
| `certificates_set_active_idp` | Set the active IdP certificate by thumbprint. Requires 'Write' on 'Infrastructure'. | `thumbprint` |
| `certificates_verify_idp` | Verify whether a certificate (by thumbprint) can be used for IdP communication. Requires 'Write' on 'Infrastructure'. | `thumbprint` |

## Consumers

| Tool | Description | Required params |
|---|---|---|
| `consumers_list` | Return all Consumers. Requires 'Read' on 'Consumer'. | — |
| `consumers_get_by_id` | Return a single Consumer by integer ID. Requires 'Read' on 'Consumer'. | `id` |
| `consumers_get_by_name` | Return a single Consumer by name (Base64-encoded automatically). Requires 'Read' on 'Consumer'. | `name` |
| `consumers_search` | Search Consumers. Filterable/sortable by: Name, Enabled, MaximumSimultaneousInstructions, OffloadTargetUrl, SystemConsumer. Requires 'Read' on 'Consumer'. | — |
| `consumers_add` | Create a Consumer. Name must be alphanumeric+underscore only, unique. System consumers cannot be created. Requires 'Write' on 'Consumer'. | `name`, `maximumSimultaneousInFlightInstructions` |
| `consumers_update` | Update an existing Consumer. System consumers cannot be renamed or disabled. Requires 'Write' on 'Consumer'. | `id` |
| `consumers_delete` | Delete a Consumer by ID. System consumers and those used by scheduled instructions cannot be deleted. Requires 'Write' on 'Consumer'. | `id` |
| `consumers_delete_many` | Delete multiple Consumers by their IDs in one request. Requires 'Write' on 'Consumer'. | `ids` |
| `consumers_refresh_cache` | Force a refresh of the internal Consumers cache. | — |

## Custom Properties

| Tool | Description | Required params |
|---|---|---|
| `custom_properties_get_by_type_id` | Return all Custom Properties for a given type ID. | `typeId` |
| `custom_properties_get_by_type_name` | Return all Custom Properties for a given type name. | `typeName` |
| `custom_properties_get_by_id` | Return a single Custom Property by its ID. | `id` |
| `custom_properties_search` | Search Custom Properties. Filterable/sortable by: Name, TypeName. | — |
| `custom_properties_add` | Create a Custom Property with optional values. Provide typeId OR typeName. Name: unique, ≤16 chars, no spaces. Values: unique, ≤32 chars each. Requires 'Write' on 'CustomProperty'. | `name` |
| `custom_properties_update` | Update a Custom Property. values=null → unchanged; values=[] → removes all values. Requires 'Write' on 'CustomProperty'. | `id` |
| `custom_properties_delete` | Delete a single Custom Property by ID. Requires 'Write' on 'CustomProperty'. | `id` |
| `custom_properties_delete_many` | Delete multiple Custom Properties by their IDs. Requires 'Write' on 'CustomProperty'. | `ids` |

## Custom Property Types

| Tool | Description | Required params |
|---|---|---|
| `custom_property_types_list` | Return all available Custom Property Types. | — |
| `custom_property_types_add` | Create a new Custom Property Type. Name: unique, ≤32 chars. System types cannot be created. Requires 'Write' on 'CustomProperty'. | `name` |

## Devices

| Tool | Description | Required params |
|---|---|---|
| `devices_list` | List all registered devices/agents known to the 1E platform. | — |
| `devices_search` | Search devices with filter/sort/pagination. Body is a SearchPostModel: start (integer offset), pageSize, sort array. includeInherited=true includes devices from child management groups. | — |
| `devices_get_by_fqdn` | Get a single device by its fully-qualified domain name (FQDN), e.g. 'hostname.domain.com'. | `fqdn` |
| `devices_get_by_tachyon_guid` | Get a single device by its Tachyon GUID (the unique identifier assigned by the 1E agent). | `guid` |
| `devices_get_management_groups_by_fqdn` | Get the Management Groups that a device (identified by FQDN) belongs to. | `fqdn` |
| `devices_summary` | Get a summary count/status of devices matching an optional filter. | — |

## Management Groups (Device Groups)

| Tool | Description | Required params |
|---|---|---|
| `management_groups_list` | List all Management Groups (device groups). These are used to scope instructions to sets of devices. | — |
| `management_groups_get_by_id` | Get a Management Group by integer ID. | `id` |
| `management_groups_get_by_name` | Get a Management Group by name. | `name` |
| `management_groups_search` | Search Management Groups with filter/sort/pagination. | — |
| `management_groups_get_contents` | Get the devices that are members of a Management Group by its integer ID. | `id` |
| `management_groups_get_all_devices` | Get all devices across all Management Groups. | — |

## Instruction Definitions

| Tool | Description | Required params |
|---|---|---|
| `instruction_definitions_list` | List all available Instruction Definitions (the templates that describe what instructions can be sent to devices). | — |
| `instruction_definitions_get_by_id` | Get a single Instruction Definition by its integer ID. Returns full schema including parameters needed. | `id` |
| `instruction_definitions_get_by_name` | Get an Instruction Definition by its exact name. Use this to find the definitionId and parameter schema before sending an instruction. | `name` |
| `instruction_definitions_search` | Search Instruction Definitions with filter/sort/pagination. | — |

## Instructions

| Tool | Description | Required params |
|---|---|---|
| `instructions_send` | Send an instruction to devices. Use definitionId or definitionName to identify the instruction template. Target devices via 'devices' (array of FQDNs like ['host.domain.com']) OR via 'scope' (management group expression). Parameters are passed as [{name, value}] pairs matching the definition's schema. | — |
| `instructions_send_to_device` | Send an instruction directly to a single device identified by its Tachyon GUID. Simpler than instructions_send when you already know the device GUID. | `guid` |
| `instructions_get_by_id` | Get an Instruction by its integer ID. Returns status, target info, parameters, and approval state. | `id` |
| `instructions_search` | Search Instructions with filter/sort/pagination. | — |
| `instructions_get_statistics` | Get execution statistics for an instruction: total devices targeted, how many responded, pending, errors. | `id` |
| `instructions_get_statistics_detail` | Get detailed per-state statistics for an instruction. | `id` |
| `instructions_get_responses` | Get the actual responses/results from devices for an instruction. local=true returns data stored locally. Supports pagination via start/pageSize. | `instructionId` |
| `instructions_get_responses_aggregate` | Get aggregated (grouped/counted) responses for an instruction — useful for survey-style instructions that return the same values from many devices. | `instructionId` |
| `instructions_get_responding_devices` | Get the list of unique device FQDNs that have responded to an instruction. | `instructionId` |
| `instructions_get_target_list` | Get the list of devices that were targeted by an instruction. | `instructionId` |
| `instructions_cancel` | Cancel a running instruction. keepData=true retains any responses already collected; keepData=false deletes them. | `id` |
| `instructions_rerun` | Re-run a previously completed instruction with the same parameters and scope. | `instructionId` |

## Scheduled Instructions

| Tool | Description | Required params |
|---|---|---|
| `scheduled_instructions_create` | Schedule an instruction to run on a recurring schedule. Uses SQL Server Agent-style schedule fields: scheduleFreqType (1=once,4=daily,8=weekly,16=monthly), scheduleFreqInterval, scheduleActiveStartDate, scheduleActiveStartTime (HHMMSS as integer, e.g. 90000 = 09:00:00). | — |
| `scheduled_instructions_get_by_id` | Get a Scheduled Instruction by integer ID. | `id` |
| `scheduled_instructions_search` | Search Scheduled Instructions with filter/sort/pagination. | — |
| `scheduled_instructions_update` | Update an existing Scheduled Instruction by ID. | `id` |
| `scheduled_instructions_cancel` | Cancel a Scheduled Instruction by integer ID. | `id` |
| `scheduled_instructions_delete` | Delete a Scheduled Instruction by integer ID. | `id` |

## Persistent Instructions

| Tool | Description | Required params |
|---|---|---|
| `persistent_instructions_create` | Create a Persistent Instruction that continuously applies to all current and future devices matching a scope. | — |
| `persistent_instructions_get_by_id` | Get a Persistent Instruction by integer ID. | `id` |
| `persistent_instructions_search` | Search Persistent Instructions with filter/sort/pagination. | — |
| `persistent_instructions_cancel` | Cancel a Persistent Instruction by integer ID. | `id` |
| `persistent_instructions_delete` | Delete a Persistent Instruction by integer ID. | `id` |
