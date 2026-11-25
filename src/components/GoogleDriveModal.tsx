import { useCallback, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  FolderOpen,
  LogOut,
  Pencil,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { GameMode, GlobalScoreState } from '../types/quiz';
import {
  buildQuizReportText,
  createQuizReportFile,
  deleteDriveFile,
  DriveAuthError,
  DriveFileItem,
  getAccessToken,
  listDriveFiles,
  readDriveFileText,
  renameDriveFile,
  updateDriveFileContent,
} from '../utils/googleDrive';
import { GoogleSignInButton } from './GoogleSignInButton';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  needsAuth: boolean;
  isLoggingIn: boolean;
  onSignIn: () => Promise<void>;
  onLogout: () => Promise<void>;
  onAuthExpired: () => void;
  canSaveQuizReport?: boolean;
  scoreState?: GlobalScoreState;
  mode?: GameMode;
}

type PendingAction =
  | { type: 'delete'; file: DriveFileItem }
  | { type: 'overwrite'; file: DriveFileItem }
  | { type: 'rename'; file: DriveFileItem; newName: string }
  | null;

export function GoogleDriveModal({
  isOpen,
  onClose,
  user,
  needsAuth,
  isLoggingIn,
  onSignIn,
  onLogout,
  onAuthExpired,
  canSaveQuizReport = false,
  scoreState,
  mode = 'solo',
}: GoogleDriveModalProps) {
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reportName, setReportName] = useState(() => {
    const d = new Date().toISOString().slice(0, 10);
    return `Resultats-Grand-Quiz-CM2-${d}.txt`;
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ name: string; content: string } | null>(null);
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const loadFiles = useCallback(
    async (query = searchQuery) => {
      const token = await getAccessToken();
      if (!token) {
        onAuthExpired();
        return;
      }
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const list = await listDriveFiles(token, query);
        setFiles(list);
      } catch (err) {
        if (err instanceof DriveAuthError) {
          onAuthExpired();
        }
        setErrorMessage(
          err instanceof Error ? err.message : 'Erreur lors du chargement de Google Drive.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, onAuthExpired]
  );

  useEffect(() => {
    if (isOpen && !needsAuth) {
      loadFiles('');
    }
  }, [isOpen, needsAuth, loadFiles]);

  if (!isOpen) return null;

  const handleSaveNewReport = async () => {
    if (!scoreState) return;
    const token = await getAccessToken();
    if (!token) {
      onAuthExpired();
      return;
    }

    const trimmedName = reportName.trim() || 'Resultats-Grand-Quiz-CM2.txt';
    // Vérifier si un fichier porte déjà ce nom : demander une confirmation avant écrasement/mise à jour
    const existing = files.find((f) => f.name.toLowerCase() === trimmedName.toLowerCase());
    if (existing) {
      setPendingAction({ type: 'overwrite', file: existing });
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const content = buildQuizReportText(scoreState, mode);
      await createQuizReportFile(token, trimmedName, content);
      setStatusMessage(`Rapport « ${trimmedName} » enregistré dans Google Drive.`);
      await loadFiles(searchQuery);
    } catch (err) {
      if (err instanceof DriveAuthError) {
        onAuthExpired();
      }
      setErrorMessage(
        err instanceof Error ? err.message : "Impossible d'enregistrer le rapport."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewFile = async (file: DriveFileItem) => {
    const token = await getAccessToken();
    if (!token) {
      onAuthExpired();
      return;
    }
    setErrorMessage(null);
    try {
      const text = await readDriveFileText(token, file);
      setPreviewFile({ name: file.name, content: text.slice(0, 6000) });
    } catch (err) {
      if (err instanceof DriveAuthError) {
        onAuthExpired();
      }
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Aperçu indisponible pour ce format de fichier.'
      );
    }
  };

  const handleConfirmPendingAction = async () => {
    if (!pendingAction) return;
    const token = await getAccessToken();
    if (!token) {
      setPendingAction(null);
      onAuthExpired();
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      if (pendingAction.type === 'delete') {
        await deleteDriveFile(token, pendingAction.file.id);
        setStatusMessage(`Fichier « ${pendingAction.file.name} » supprimé de Google Drive.`);
      } else if (pendingAction.type === 'overwrite' && scoreState) {
        const content = buildQuizReportText(scoreState, mode);
        await updateDriveFileContent(token, pendingAction.file.id, content);
        setStatusMessage(`Fichier « ${pendingAction.file.name} » mis à jour dans Google Drive.`);
      } else if (pendingAction.type === 'rename') {
        await renameDriveFile(token, pendingAction.file.id, pendingAction.newName);
        setStatusMessage(`Fichier renommé en « ${pendingAction.newName} ».`);
        setRenamingFileId(null);
      }
      setPendingAction(null);
      await loadFiles(searchQuery);
    } catch (err) {
      if (err instanceof DriveAuthError) {
        onAuthExpired();
      }
      setErrorMessage(
        err instanceof Error ? err.message : "L'opération sur Google Drive a échoué."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Gestion Google Drive"
    >
      <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-[#132240] border border-slate-700 text-slate-100 shadow-2xl flex flex-col overflow-hidden">
        {/* En-tête */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-700/80 bg-[#0F1C36]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-300 flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-extrabold text-white truncate">
                Google Drive de la classe
              </h2>
              <p className="text-xs text-slate-400 truncate">
                {user && !needsAuth
                  ? `Connecté : ${user.email || user.displayName}`
                  : 'Connectez votre compte Google pour accéder à Drive'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {user && !needsAuth && (
              <button
                type="button"
                onClick={onLogout}
                className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Déconnexion</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer la fenêtre Google Drive"
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Corps */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {needsAuth ? (
            <div className="rounded-2xl bg-slate-900/75 border border-slate-700/80 p-7 text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/40 text-amber-300 flex items-center justify-center">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div className="max-w-md">
                <h3 className="font-display text-xl font-bold text-white">
                  Connexion à Google Drive requise
                </h3>
                <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
                  Connectez-vous avec Google pour sauvegarder les résultats du Grand Quiz CM2 et
                  consulter vos fichiers Drive en toute sécurité.
                </p>
              </div>
              <GoogleSignInButton
                onClick={onSignIn}
                disabled={isLoggingIn}
                label={isLoggingIn ? 'Connexion en cours...' : 'Se connecter avec Google'}
              />
            </div>
          ) : (
            <>
              {/* Sauvegarde des résultats du quiz */}
              {canSaveQuizReport && scoreState && (
                <div className="rounded-2xl bg-slate-900/80 border border-amber-400/40 p-4 flex flex-col gap-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Sauvegarder le bilan du quiz sur Google Drive
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      placeholder="Nom du fichier..."
                      aria-label="Nom du rapport à enregistrer"
                      className="flex-1 h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-sm text-white"
                    />
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleSaveNewReport}
                      className="h-11 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-display text-sm font-extrabold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'Enregistrement...' : 'Enregistrer sur Drive'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Messages statut / erreur */}
              {statusMessage && (
                <div className="rounded-xl bg-emerald-500/15 border border-emerald-400/40 px-4 py-3 text-sm text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="rounded-xl bg-rose-500/15 border border-rose-400/40 px-4 py-3 text-sm text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Boîte de confirmation obligatoire pour toute modification ou suppression */}
              {pendingAction && (
                <div
                  role="alertdialog"
                  aria-modal="true"
                  className="rounded-2xl bg-rose-950/70 border border-rose-400/60 p-4 flex flex-col gap-3"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                    <div className="text-sm text-slate-100">
                      {pendingAction.type === 'delete' && (
                        <>
                          Voulez-vous vraiment supprimer définitivement le fichier{' '}
                          <span className="font-bold text-white">
                            « {pendingAction.file.name} »
                          </span>{' '}
                          de votre Google Drive ? Cette action est irréversible.
                        </>
                      )}
                      {pendingAction.type === 'overwrite' && (
                        <>
                          Le fichier{' '}
                          <span className="font-bold text-white">
                            « {pendingAction.file.name} »
                          </span>{' '}
                          existe déjà sur votre Google Drive. Voulez-vous remplacer son contenu par
                          le nouveau bilan du quiz ?
                        </>
                      )}
                      {pendingAction.type === 'rename' && (
                        <>
                          Confirmer le renommage de{' '}
                          <span className="font-bold text-white">
                            « {pendingAction.file.name} »
                          </span>{' '}
                          en{' '}
                          <span className="font-bold text-amber-300">
                            « {pendingAction.newName} »
                          </span>{' '}
                          ?
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => setPendingAction(null)}
                      className="h-9 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleConfirmPendingAction}
                      className={`h-9 px-4 rounded-xl text-xs font-extrabold cursor-pointer ${
                        pendingAction.type === 'delete'
                          ? 'bg-rose-500 hover:bg-rose-400 text-white'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                      }`}
                    >
                      {pendingAction.type === 'delete'
                        ? 'Confirmer la suppression'
                        : pendingAction.type === 'overwrite'
                          ? 'Confirmer le remplacement'
                          : 'Confirmer le renommage'}
                    </button>
                  </div>
                </div>
              )}

              {/* Aperçu d'un fichier texte */}
              {previewFile && (
                <div className="rounded-2xl bg-slate-950 border border-slate-700 p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-sky-300 truncate">
                      Aperçu : {previewFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewFile(null)}
                      className="text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Fermer l’aperçu
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap max-h-44 overflow-y-auto bg-slate-900/70 rounded-xl p-3 border border-slate-800">
                    {previewFile.content}
                  </pre>
                </div>
              )}

              {/* Barre de recherche dans Drive */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loadFiles(searchQuery);
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un fichier dans Google Drive..."
                    aria-label="Rechercher un fichier dans Google Drive"
                    className="w-full h-10 pl-10 pr-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-sky-400 focus:outline-none text-sm text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="h-10 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer"
                >
                  Rechercher
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => loadFiles(searchQuery)}
                  title="Actualiser"
                  aria-label="Actualiser la liste Drive"
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </form>

              {/* Liste des fichiers */}
              <div className="flex flex-col gap-2">
                {isLoading && files.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">
                    Chargement de vos fichiers Google Drive...
                  </div>
                ) : files.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400 rounded-2xl bg-slate-900/40 border border-slate-800">
                    Aucun fichier trouvé.
                  </div>
                ) : (
                  files.map((file) => {
                    const isTextLike =
                      file.mimeType.startsWith('text/') ||
                      file.mimeType === 'application/json' ||
                      file.mimeType === 'application/vnd.google-apps.document';
                    const isRenaming = renamingFileId === file.id;

                    return (
                      <div
                        key={file.id}
                        className="rounded-xl bg-slate-900/70 border border-slate-700/70 px-3.5 py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            {isRenaming ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={renameInput}
                                  onChange={(e) => setRenameInput(e.target.value)}
                                  className="h-8 px-2.5 rounded-lg bg-slate-950 border border-sky-400 text-xs text-white flex-1 min-w-0"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const trimmed = renameInput.trim();
                                    if (trimmed && trimmed !== file.name) {
                                      setPendingAction({
                                        type: 'rename',
                                        file,
                                        newName: trimmed,
                                      });
                                    } else {
                                      setRenamingFileId(null);
                                    }
                                  }}
                                  className="h-8 px-2.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                                >
                                  OK
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRenamingFileId(null)}
                                  className="h-8 px-2 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
                                >
                                  Annuler
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="text-sm font-semibold text-white truncate">
                                  {file.name}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  {file.modifiedTime
                                    ? new Date(file.modifiedTime).toLocaleDateString('fr-FR')
                                    : 'Google Drive'}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {!isRenaming && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isTextLike && (
                              <button
                                type="button"
                                onClick={() => handlePreviewFile(file)}
                                className="h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold cursor-pointer"
                              >
                                Lire
                              </button>
                            )}
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Ouvrir dans Google Drive"
                                aria-label={`Ouvrir ${file.name} dans Google Drive`}
                                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setRenamingFileId(file.id);
                                setRenameInput(file.name);
                              }}
                              title="Renommer"
                              aria-label={`Renommer ${file.name}`}
                              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingAction({ type: 'delete', file })}
                              title="Supprimer"
                              aria-label={`Supprimer ${file.name}`}
                              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
