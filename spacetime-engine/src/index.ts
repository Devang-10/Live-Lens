import type { ReducerCtx } from 'spacetimedb/server';
import { schema, table } from 'spacetimedb/server';
// @ts-ignore
import { t } from 'spacetimedb/server';

// 1. Define your GlobalScan table
const GlobalScan = table(
  {
    public: true,
    name: 'GlobalScan'
  },
  {
    sender_id: t.string(),
    article_text: t.string(),
    annotations_json: t.string()
  }
);

// New Post table
const Post = table(
  {
    public: true,
    name: 'Post'
  },
  {
    id: t.string(),
    author_username: t.string(),
    article_text: t.string(),
    annotations_json: t.string(),
    timestamp: t.string()
  }
);

// New Comment table
const Comment = table(
  {
    public: true,
    name: 'Comment'
  },
  {
    id: t.string(),
    post_id: t.string(),
    author_username: t.string(),
    content: t.string(),
    timestamp: t.string()
  }
);

// 2. Initialize the schema
const spacetimedb = schema({ GlobalScan, Post, Comment });

// 3. Define Reducers
export const broadcast_scan = spacetimedb.reducer(
  { article_text: t.string(), annotations_json: t.string() },
  (ctx: ReducerCtx, { article_text, annotations_json }: { article_text: string, annotations_json: string }) => {
    ctx.db.GlobalScan.insert({
      sender_id: ctx.sender.toHexString(),
      article_text,
      annotations_json
    });
  }
);

export const submit_post = spacetimedb.reducer(
  { id: t.string(), author_username: t.string(), article_text: t.string(), annotations_json: t.string(), timestamp: t.string() },
  (ctx: ReducerCtx, args: { id: string, author_username: string, article_text: string, annotations_json: string, timestamp: string }) => {
    ctx.db.Post.insert(args);
  }
);

export const add_comment = spacetimedb.reducer(
  { id: t.string(), post_id: t.string(), author_username: t.string(), content: t.string(), timestamp: t.string() },
  (ctx: ReducerCtx, args: { id: string, post_id: string, author_username: string, content: string, timestamp: string }) => {
    ctx.db.Comment.insert(args);
  }
);

export default spacetimedb;