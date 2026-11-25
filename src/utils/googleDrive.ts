import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { GameMode, GlobalScoreState } from '../types/quiz';
import { ROUND_CONFIGS } from '../data/questions';

export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
GOOGLE_DRIVE_SCOPES.forEach((scope) => provider.addScope(scope));

// Cache the OAuth access token strictly in memory (never localStorage/sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthFailure?.(user);
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure?.(null);
    }
  });
};

export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Impossible d'obtenir le jeton d'accès Google Drive.");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const clearAccessToken = () => {
  cachedAccessToken = null;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
}

export class DriveAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DriveAuthError';
  }
}

async function ensureOk(res: Response): Promise<Response> {
  if (res.status === 401) {
    cachedAccessToken = null;
    throw new DriveAuthError('Session Google Drive expirée. Veuillez vous reconnecter.');
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || `Erreur Google Drive (${res.status})`);
  }
  return res;
}

export async function listDriveFiles(
  accessToken: string,
  searchQuery = ''
): Promise<DriveFileItem[]> {
  const escaped = searchQuery.trim().replace(/'/g, "\\'");
  const qParts = ['trashed = false'];
  if (escaped) {
    qParts.push(`name contains '${escaped}'`);
  }
  const params = new URLSearchParams({
    pageSize: '25',
    orderBy: 'modifiedTime desc',
    fields: 'files(id,name,mimeType,modifiedTime,size,webViewLink)',
    q: qParts.join(' and '),
  });

  const res = await ensureOk(
    await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
  const data = (await res.json()) as { files?: DriveFileItem[] };
  return data.files ?? [];
}

export function buildQuizReportText(scoreState: GlobalScoreState, mode: GameMode): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    dateStyle: 'full',
  });
  const timeStr = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const accuracy =
    scoreState.totalAnswered > 0
      ? Math.round((scoreState.correctCount / scoreState.totalAnswered) * 100)
      : 0;

  const modeLabel =
    mode === 'solo'
      ? 'Solo'
      : mode === 'teams'
        ? 'Équipes'
        : 'Vidéo Auto (Classe)';

  const lines: string[] = [
    '====================================================',
    'ÉCOLE SCIENTIFIQUE ABOUD — GRAND QUIZ MATHÉMATIQUE CM2',
    '====================================================',
    `Date : ${dateStr} à ${timeStr}`,
    `Mode : ${modeLabel}`,
    `Score Global Final : ${scoreState.totalPoints.toLocaleString('fr-FR')} pts`,
    `Bonnes réponses : ${scoreState.correctCount}/${scoreState.totalAnswered} (${accuracy}%)`,
    `Meilleure série : ${scoreState.bestStreak} d'affilée`,
    '',
  ];

  if (mode === 'teams' && scoreState.teams.length > 0) {
    lines.push('--- CLASSEMENT DES ÉQUIPES ---');
    const sorted = [...scoreState.teams].sort((a, b) => b.points - a.points);
    sorted.forEach((team, i) => {
      lines.push(`${i + 1}. ${team.name} : ${team.points} pts (${team.correct} bonnes réponses)`);
    });
    lines.push('');
  }

  lines.push('--- DÉTAIL PAR MANCHE ---');
  ROUND_CONFIGS.forEach((round) => {
    const stat = scoreState.roundStats[round.id];
    lines.push(
      `- ${round.numberLabel} (${round.title}) : ${stat.points} pts | ${stat.correct}/${stat.total} réussies`
    );
  });

  if (scoreState.history.length > 0) {
    lines.push('');
    lines.push('--- HISTORIQUE DES RÉPONSES ---');
    scoreState.history.forEach((item, idx) => {
      const status = item.isCorrect ? 'OK' : 'À revoir';
      const userAns = item.userSelection || 'Temps écoulé';
      lines.push(
        `${idx + 1}. [${status}] Réponse donnée : ${userAns} | Attendu : ${item.correctDisplay} (+${item.pointsEarned} pts)`
      );
    });
  }

  return lines.join('\n');
}

export async function createQuizReportFile(
  accessToken: string,
  fileName: string,
  content: string
): Promise<DriveFileItem> {
  const metadata = {
    name: fileName,
    mimeType: 'text/plain',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: 'text/plain;charset=utf-8' }));

  const res = await ensureOk(
    await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      }
    )
  );
  return (await res.json()) as DriveFileItem;
}

export async function updateDriveFileContent(
  accessToken: string,
  fileId: string,
  content: string
): Promise<DriveFileItem> {
  const res = await ensureOk(
    await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media&fields=id,name,mimeType,modifiedTime,size,webViewLink`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: content,
      }
    )
  );
  return (await res.json()) as DriveFileItem;
}

export async function renameDriveFile(
  accessToken: string,
  fileId: string,
  newName: string
): Promise<DriveFileItem> {
  const res = await ensureOk(
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,modifiedTime,size,webViewLink`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      }
    )
  );
  return (await res.json()) as DriveFileItem;
}

export async function readDriveFileText(
  accessToken: string,
  file: DriveFileItem
): Promise<string> {
  const isGoogleDoc = file.mimeType === 'application/vnd.google-apps.document';
  const url = isGoogleDoc
    ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/export?mimeType=text/plain`
    : `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`;

  const res = await ensureOk(
    await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
  return await res.text();
}

export async function deleteDriveFile(accessToken: string, fileId: string): Promise<void> {
  await ensureOk(
    await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}
