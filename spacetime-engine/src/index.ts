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

// 2. Initialize the schema
const spacetimedb = schema({ GlobalScan });

// 3. Define the broadcast_scan Reducer
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

export default spacetimedb;