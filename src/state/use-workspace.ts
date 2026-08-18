import { useContext } from 'react';
import { WorkspaceContext, type WorkspaceContextValue } from './WorkspaceProvider';

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (context === null) {
    throw new Error('useWorkspace 必须在 WorkspaceProvider 内部使用。');
  }
  return context;
}
