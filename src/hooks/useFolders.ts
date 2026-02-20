import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { folderStorage } from "@/integrations/supabase/folders";
import { Folder } from "@/types/folder";

export const useFolders = () => {
  const queryClient = useQueryClient();

  const { data: folders = [], isLoading: isLoadingFolders } = useQuery({
    queryKey: ["folders"],
    queryFn: () => folderStorage.getFolders(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const addFolder = useMutation({
      mutationFn: (folderData: Omit<Folder, "id" | "createdAt" | "userId" | "updatedAt">) => {
        const newFolder: Folder = {
          ...folderData,
          id: crypto.randomUUID(),
          userId: "", // Sera remplacé par le trigger de la base de données
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return folderStorage.addFolder(newFolder);
      },
      onMutate: async (folderData: Omit<Folder, "id" | "createdAt" | "userId" | "updatedAt">) => {
        await queryClient.cancelQueries({ queryKey: ["folders"] });
        const previousFolders = queryClient.getQueryData<Folder[]>(["folders"]);
  
        const newFolder: Folder = {
          ...folderData,
          id: crypto.randomUUID(),
          userId: "", // Sera remplacé par le trigger de la base de données
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
    
        queryClient.setQueryData<Folder[]>(["folders"], (old = []) => [...old, newFolder]);
        
        return {previousFolders};
      },
      onError: (_err, _folderData, context) => {
        if (context?.previousFolders) {
          queryClient.setQueryData(["folders"], context.previousFolders);
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["folders"] });
      },
    });
  
    const updateFolder = useMutation({
      mutationFn: ({ id, updates }: { id: string; updates: Partial<Folder> }) => folderStorage.updateFolder(id, updates),
      
      onMutate: async ({ id, updates }) => {
        await queryClient.cancelQueries({ queryKey: ["folders"] });
        const previousFolders = queryClient.getQueryData<Folder[]>(["folders"]);
        queryClient.setQueryData<Folder[]>(["folders"], (old = []) =>
          old.map(folder => folder.id === id ? { ...folder, ...updates } : folder)
        );
        return { previousFolders };
      },
      onError: (_err, _variables, context) => {
        if (context?.previousFolders) {
          queryClient.setQueryData(["folders"], context.previousFolders);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["folders"] });
      },
    });

    const deleteFolder = useMutation({
      mutationFn: (folderId: string) => folderStorage.deleteFolder(folderId),

      onMutate: async (folderId: string) => {
        await queryClient.cancelQueries({ queryKey: ["folders"] });
        const previousFolders = queryClient.getQueryData<Folder[]>(["folders"]);
        queryClient.setQueryData<Folder[]>(["folders"], (old = []) =>
          old.filter(folder => folder.id !== folderId)
        );
        return { previousFolders };
      },
      onError: (_err, _folderId, context) => {
        if (context?.previousFolders) {
          queryClient.setQueryData(["folders"], context.previousFolders);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["folders"] });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      },
    });

    return {
    folders,
    isLoading: isLoadingFolders,
    addFolder,
    updateFolder,
    deleteFolder,
  };
};