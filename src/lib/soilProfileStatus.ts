type SoilValues = {
  ph?: number | null;
  moisture?: number | null;
};

type SoilReport = {
  values?: SoilValues;
  updatedAt?: Date | string;
};

type SoilProfile = {
  landName?: string;
  location?: {
    state?: string;
    district?: string;
    village?: string;
  };
  state?: string;
  district?: string;
  ph?: number | null;
  moisture?: number | null;
  updatedAt?: Date | string;
  retestRequestedAt?: Date | string;
};

type SoilKitOrder = {
  status?: 'ordered' | 'packed' | 'shipped' | 'out-for-delivery' | 'delivered';
};

export type SoilProfileStatus = {
  status:
    | 'land-pending'
    | 'kit-pending'
    | 'kit-ordered'
    | 'values-captured'
    | 'card-pending'
    | 'ready'
    | 'completed'
    | 'retest';
  stage: 1 | 2 | 3 | 4;
  progress: number;
  lastTestedAt?: Date;
  retestNeeded: boolean;
};

const isNumber = (value?: number | null) => typeof value === 'number' && !Number.isNaN(value);

const normalizeDate = (value?: Date | string) => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const getLatestDate = (dates: Array<Date | undefined>) => {
  const timestamps = dates
    .filter((value): value is Date => Boolean(value))
    .map((value) => value.getTime());
  if (timestamps.length === 0) return undefined;
  return new Date(Math.max(...timestamps));
};

export const computeSoilProfileStatus = (input: {
  profile?: SoilProfile | null;
  kitOrder?: SoilKitOrder | null;
  kitReport?: SoilReport | null;
  govtReport?: SoilReport | null;
  now?: Date;
}): SoilProfileStatus => {
  const now = input.now || new Date();
  const profile = input.profile || null;
  const kitReport = input.kitReport || null;
  const govtReport = input.govtReport || null;

  const landReady = Boolean(
    profile?.landName &&
      (profile?.location?.state || profile?.state) &&
      (profile?.location?.district || profile?.district)
  );
  const kitComplete = Boolean(isNumber(kitReport?.values?.ph) && isNumber(kitReport?.values?.moisture));
  const govtComplete = Boolean(isNumber(govtReport?.values?.ph) && isNumber(govtReport?.values?.moisture));
  const finalReady = Boolean(profile?.ph != null && profile?.moisture != null);

  const lastTestedAt = getLatestDate([
    normalizeDate(kitReport?.updatedAt),
    normalizeDate(govtReport?.updatedAt),
    normalizeDate(profile?.updatedAt)
  ]);

  const retestRequestedAt = normalizeDate(profile?.retestRequestedAt);
  const sixMonthsMs = 1000 * 60 * 60 * 24 * 180;
  const isStale = lastTestedAt ? now.getTime() - lastTestedAt.getTime() > sixMonthsMs : false;
  const retestNeeded = Boolean(retestRequestedAt || (finalReady && isStale));

  if (!landReady) {
    return { status: 'land-pending', stage: 1, progress: 15, lastTestedAt, retestNeeded };
  }

  if (retestNeeded) {
    return { status: 'retest', stage: 2, progress: 55, lastTestedAt, retestNeeded };
  }

  if (!kitComplete) {
    const status = input.kitOrder?.status ? 'kit-ordered' : 'kit-pending';
    return { status, stage: 2, progress: status === 'kit-ordered' ? 45 : 35, lastTestedAt, retestNeeded };
  }

  if (!govtComplete) {
    return { status: 'values-captured', stage: 3, progress: 65, lastTestedAt, retestNeeded };
  }

  if (!finalReady) {
    return { status: 'ready', stage: 4, progress: 85, lastTestedAt, retestNeeded };
  }

  return { status: 'completed', stage: 4, progress: 100, lastTestedAt, retestNeeded };
};
