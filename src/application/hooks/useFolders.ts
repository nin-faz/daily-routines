import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { folderStorage } from "@/data/repositories/folders";
import { Folder } from "@/shared/types/folder";
import { useAuth } from "@/application/context/AuthContext";
import { buildFolder } from "@/domain/builders";

export const useFolders = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  /**
  * Utiliser une clé de requête spécifique à l'utilisateur pour éviter les conflits entre les utilisateurs
  * qui se connectent sur le même appareil ou dans des onglets différents. 
  */
  const queryKey = ["folders", user?.id];

  const { data: folders = [], isLoading: isLoadingFolders } = useQuery({
    queryKey: queryKey,
    queryFn: () => folderStorage.getFolders(),
    // On ne lance la requête QUE si l'utilisateur est connu
    enabled: !!user?.id, 
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const addFolder = useMutation({
      mutationFn: (folderData: Omit<Folder, "id" | "createdAt" | "userId" | "updatedAt">) =>
        folderStorage.addFolder(buildFolder(folderData, user?.id || "")),
      onMutate: async (folderData: Omit<Folder, "id" | "createdAt" | "userId" | "updatedAt">) => {
        await queryClient.cancelQueries({ queryKey: queryKey });
        const previousFolders = queryClient.getQueryData<Folder[]>(queryKey);
        queryClient.setQueryData<Folder[]>(queryKey, (old = []) => [
          ...old,
          buildFolder(folderData, user?.id || ""),
        ]);
        return { previousFolders };
      },
      onError: (_err, _folderData, context) => {
        if (context?.previousFolders) {
          queryClient.setQueryData(queryKey, context.previousFolders);
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKey });
      },
    });
  
    const updateFolder = useMutation({
      mutationFn: ({ id, updates }: { id: string; updates: Partial<Folder> }) => folderStorage.updateFolder(id, updates),
      
      onMutate: async ({ id, updates }) => {
        await queryClient.cancelQueries({ queryKey: queryKey });
        const previousFolders = queryClient.getQueryData<Folder[]>(queryKey);
        queryClient.setQueryData<Folder[]>(queryKey, (old = []) =>
          old.map(folder => folder.id === id ? { ...folder, ...updates } : folder)
        );
        return { previousFolders };
      },
      onError: (_err, _variables, context) => {
        if (context?.previousFolders) {
          queryClient.setQueryData(queryKey, context.previousFolders);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: queryKey });
      },
    });

    const deleteFolder = useMutation({
      mutationFn: (folderId: string) => folderStorage.deleteFolder(folderId),

      onMutate: async (folderId: string) => {
        await queryClient.cancelQueries({ queryKey: queryKey });
        const previousFolders = queryClient.getQueryData<Folder[]>(queryKey);
        queryClient.setQueryData<Folder[]>(queryKey, (old = []) =>
          old.filter(folder => folder.id !== folderId)
        );
        return { previousFolders };
      },
      onError: (_err, _folderId, context) => {
        if (context?.previousFolders) {
          queryClient.setQueryData(queryKey, context.previousFolders);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: queryKey });
        queryClient.invalidateQueries({ queryKey: ["tasks", user?.id] });
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