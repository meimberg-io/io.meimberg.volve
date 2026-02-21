"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SeedingView } from "@/components/project/SeedingView";
import { Skeleton } from "@/components/ui/skeleton";
import type { Process, SeedDocument } from "@/types";

export default function SeedPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Process | null>(null);
  const [documents, setDocuments] = useState<SeedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const supabase = createClient();

    const { data: proc } = await supabase
      .from("processes")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!proc) {
      router.push("/projects");
      return;
    }

    if (proc.status !== "seeding") {
      router.push(`/project/${projectId}`);
      return;
    }

    setProject(proc);

    const { data: docs } = await supabase
      .from("seed_documents")
      .select("*")
      .eq("process_id", projectId)
      .order("order_index", { ascending: true });

    setDocuments(docs ?? []);
    setLoading(false);
  }, [projectId, router]);

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
      const storagePath = `${user.id}/${projectId}/${Date.now()}_${file.name}`;

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
          process_id: projectId,
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
      .eq("id", projectId);

    router.push(`/project/${projectId}`);
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
      processName={project?.name ?? ""}
      documents={documents}
      onUpload={handleUpload}
      onDelete={handleDelete}
      onPlantSeed={handlePlantSeed}
    />
  );
}
