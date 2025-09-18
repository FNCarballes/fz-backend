// src/sockets/types.ts
import type { Socket } from "socket.io";

export type UserPayload = {
  userId: string;
  role?: "user" | "admin";
  sessionId?: string;
};

export type AppSocket = Socket & {
  data: { user: UserPayload };
};

export const EVENTS = {
  // CHAT
  CHAT: {
    // client -> server
    JOIN: "chat:room:join:v1",
    LEAVE: "chat:room:leave:v1",
    SEND: "chat:message:send:v1",               // use ack (persistence)
    HISTORY_REQUEST: "chat:history:request:v1", // use ack or HISTORY_RESPONSE

    // server -> clients in room
    NEW: "chat:message:new:v1",                 // broadcast persisted message
    MEMBER_JOINED: "chat:member:joined:v1",     // someone joined the room
    MEMBER_LEFT: "chat:member:left:v1",         // someone left the room
    MEMBERS_LIST: "chat:members:list:v1",       // (optional) list of members

    // message lifecycle
    MESSAGE_UPDATED: "chat:message:updated:v1",
    MESSAGE_DELETED: "chat:message:deleted:v1",

    // receipts & delivery
    MESSAGE_DELIVERED: "chat:message:delivered:v1", // server -> recipient device(s)
    MESSAGE_READ: "chat:message:read:v1",           // server -> room to update read receipts

    // reactions
    MESSAGE_REACTION_ADD: "chat:message:reaction:add:v1",
    MESSAGE_REACTION_REMOVE: "chat:message:reaction:remove:v1",

    // typing
    TYPING: "chat:typing:v1",

    // history (alternative)
    HISTORY_RESPONSE: "chat:history:response:v1",
  },

  // NOTIFICATIONS
  NOTIF: {
    SUBSCRIBE: "notif:subscribe:v1",
    NEW: "notif:new:v1",
    READ: "notif:read:v1",
    BATCH: "notif:batch:v1",
    GET: "notif:get:v1",  },

  // DOMAIN: EVENTS (meetups, activities, etc.)
  EVENTS: {
    CREATE: "events:create:v1",
    UPDATE: "events:update:v1",
    CANCEL: "events:cancel:v1",
    JOIN: "events:join:v1",
    LEAVE: "events:leave:v1",
    ATTENDEE_JOINED: "events:attendee:joined:v1",
    STATE: "events:state:v1",
  },

  // SYSTEM / infra-level events
  SYSTEM: {
    HEARTBEAT: "system:heartbeat:v1",
    PROTOCOL_DEPRECATED: "system:protocol:deprecated:v1",
    ERROR: "system:error:v1",
    // optional presence / connection events
    USER_ONLINE: "system:user:online:v1",
    USER_OFFLINE: "system:user:offline:v1",
  },
} as const;

/** helper type: unión de todos los event strings */
type DeepValues<T> = T extends string ? T : { [K in keyof T]: DeepValues<T[K]> }[keyof T];
export type EventName = DeepValues<typeof EVENTS>;
