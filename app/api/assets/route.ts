import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase().trim();
  const keywords = q.split(" ").filter(Boolean);

  const { data: assets, error } = await supabase
    .from('assets')
    .select('*')
    .order('id', { ascending: false }); // Using ID for order since existing IDs are timestamps

  if (error) {
    console.error("Supabase error:", error);
    return Response.json([], { status: 500 });
  }

  if (keywords.length === 0) {
    return Response.json(assets);
  }

  const result = assets.filter((a: any) => {
    const content = (a.title + " " + a.tags).toLowerCase();
    return keywords.every((kw) => content.includes(kw));
  });

  return Response.json(result);
}

export async function POST(req: Request) {
  const body = await req.json();

  const { data, error } = await supabase
    .from('assets')
    .insert([{
      title: body.title,
      fileUrl: body.fileUrl,
      tags: body.tags,
    }])
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const idString = searchParams.get("id") || "";
  
  // Try parsing as int, if it's a timestamp ID
  const id = parseInt(idString);

  if (isNaN(id)) {
    return Response.json({ error: "Invalid ID" }, { status: 400 });
  }

  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Supabase delete error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  
  return Response.json({ success: true });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, title, tags } = body;

  if (!id) {
    return Response.json({ error: "Invalid ID" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('assets')
    .update({ title, tags })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("Supabase update error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}