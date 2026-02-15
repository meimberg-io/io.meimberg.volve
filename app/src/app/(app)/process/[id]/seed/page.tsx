"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SeedingView } from "@/components/process/SeedingView";
import { Skeleton } from "@/components/ui/skeleton";
import type { Process, SeedDocument } from "@/types";

export default function SeedPage() {
  const params = useParams();
  const router = useRouter();
  const processId = params.id as string;

  const [process, setProcess] = useState<Process | null>(null);
  const [documents, setDocuments] = useState<SeedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const supabase = createClient();

    const { data: proc } = await supabase
      .from("processes")
      .select("*")
      .eq("id", processId)
      .single();

    if (!proc) {
      router.push("/dashboard");
      return;
    }

    // If process is not in seeding, redirect to stage overview
    if (proc.status !== "seeding") {
      router.push(`/process/${processId}`);
      return;
    }

    setProcess(proc);

    const { data: docs } = await supabase
      .from("seed_documents")
      .select("*")
      .eq("process_id", processId)
      .order("order_index", { ascending: true });

    setDocuments(docs ?? []);
    setLoading(false);
  }, [processId, router]);

  useEffect(() => {
    loadData(); // eslint-disable-line react-hooks/set-state-in-effect -- async data fetch
  }, [loadData]);

  const handleUpload = async (files: File[]) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    for (const file of files) {
      const storagePath = `${user.id}/${processId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("seeds")
        .upload(storagePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      const nextIndex = documents.length;

      const { data } = await supabase
        .from("seed_documents")
        .insert({
          process_id: processId,
          filename: file.name,
          storage_path: storagePath,
          mime_type: file.type || "application/octet-stream",
          size_bytes: file.size,
          order_index: nextIndex,
        })
        .select()
        .single();

      if (data) {
        setDocuments((prev) => [...prev, data]);
      }
    }
  };

  const handleDelete = async (docId: string, storagePath: string) => {
    const supabase = createClient();
    await supabase.storage.from("seeds").remove([storagePath]);
    await supabase.from("seed_documents").delete().eq("id", docId);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handlePlantSeed = async () => {
    const supabase = createClient();
    await supabase
      .from("processes")
      .update({ status: "active" })
      .eq("id", processId);

    router.push(`/process/${processId}`);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <SeedingView
      processName={process?.name ?? ""}
      documents={documents}
      onUpload={handleUpload}
      onDelete={handleDelete}
      onPlantSeed={handlePlantSeed}
    />
  );
}
