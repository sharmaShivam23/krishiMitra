import { NextResponse } from 'next/server';

const SHC_GRAPHQL_URL = 'https://soilhealth4.dac.gov.in/graphql';

/* ── GraphQL Queries ── */
const SEARCH_BY_PHONE = `
  query GetTestForPortalForSchool($phone: String) {
    getTestForPortalForSchool(phone: $phone) {
      farmer { name __typename }
      computedID
      sampleDate
      cycle
      scheme
      status
      __typename
    }
  }
`;

const SEARCH_BY_LOCATION = `
  query GetTestForPortal($state: String, $district: String, $village: String, $phone: String, $farmername: String) {
    getTestForPortal(
      state: $state
      district: $district
      village: $village
      phone: $phone
      farmername: $farmername
    ) {
      farmer { name __typename }
      computedID
      sampleDate
      cycle
      scheme
      status
      __typename
    }
  }
`;

const GET_CARD_DETAIL = `
  query GetCardPortalByComputedID($computedID: String!) {
    getCardPortalByComputedID(computedID: $computedID) {
      farmer { name __typename }
      computedID
      sampleDate
      cycle
      scheme
      status
      pH
      EC
      OC
      N
      P
      K
      S
      Zn
      B
      Fe
      Mn
      Cu
      __typename
    }
  }
`;

const GET_STATES = `
  query GetState {
    getState {
      _id
      name
      __typename
    }
  }
`;

const GET_DISTRICTS = `
  query GetdistrictAndSubdistrictBystate($state: String!) {
    getdistrictAndSubdistrictBystate(state: $state) {
      _id
      name
      __typename
    }
  }
`;

async function gqlFetch(operationName: string, query: string, variables: Record<string, string | undefined>) {
  const res = await fetch(SHC_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    body: JSON.stringify({ operationName, query, variables }),
  });
  if (!res.ok) throw new Error(`SHC API returned ${res.status}`);
  return res.json();
}

/* ═══════════════════════════════════════════
   POST /api/shc-lookup
   
   Actions:
   - search-phone: search by phone number
   - search-location: search by state/district/name
   - get-detail: get detailed test result
   - get-states: get state list
   - get-districts: get districts for a state
═══════════════════════════════════════════ */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'search-phone': {
        const { phone } = body;
        if (!phone) return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
        // Normalize phone: add +91 if needed
        let normalizedPhone = phone.replace(/\s+/g, '').replace(/^0+/, '');
        if (!normalizedPhone.startsWith('+')) {
          normalizedPhone = normalizedPhone.startsWith('91') ? `+${normalizedPhone}` : `+91${normalizedPhone}`;
        }
        const data = await gqlFetch('GetTestForPortalForSchool', SEARCH_BY_PHONE, { phone: normalizedPhone });
        return NextResponse.json({
          success: true,
          tests: data?.data?.getTestForPortalForSchool || [],
        });
      }

      case 'search-location': {
        const { state, district, village, phone, farmername } = body;
        const data = await gqlFetch('GetTestForPortal', SEARCH_BY_LOCATION, {
          state: state || undefined,
          district: district || undefined,
          village: village || undefined,
          phone: phone || undefined,
          farmername: farmername || undefined,
        });
        return NextResponse.json({
          success: true,
          tests: data?.data?.getTestForPortal || [],
        });
      }

      case 'get-detail': {
        const { computedID } = body;
        if (!computedID) return NextResponse.json({ error: 'computedID required' }, { status: 400 });
        const data = await gqlFetch('GetCardPortalByComputedID', GET_CARD_DETAIL, { computedID });
        const card = data?.data?.getCardPortalByComputedID;
        if (!card) return NextResponse.json({ error: 'Card not found', raw: data }, { status: 404 });
        
        // Normalize values
        const values = {
          n: parseFloat(card.N) || undefined,
          p: parseFloat(card.P) || undefined,
          k: parseFloat(card.K) || undefined,
          ec: parseFloat(card.EC) || undefined,
          organicCarbon: parseFloat(card.OC) || undefined,
          ph: parseFloat(card.pH) || undefined,
          s: parseFloat(card.S) || undefined,
          zn: parseFloat(card.Zn) || undefined,
          b: parseFloat(card.B) || undefined,
          fe: parseFloat(card.Fe) || undefined,
          mn: parseFloat(card.Mn) || undefined,
          cu: parseFloat(card.Cu) || undefined,
        };

        return NextResponse.json({
          success: true,
          card: {
            computedID: card.computedID,
            farmerName: card.farmer?.name,
            sampleDate: card.sampleDate,
            cycle: card.cycle,
            scheme: card.scheme,
            status: card.status,
            values,
          },
        });
      }

      case 'get-states': {
        const data = await gqlFetch('GetState', GET_STATES, {});
        return NextResponse.json({
          success: true,
          states: data?.data?.getState || [],
        });
      }

      case 'get-districts': {
        const { stateId } = body;
        if (!stateId) return NextResponse.json({ error: 'stateId required' }, { status: 400 });
        const data = await gqlFetch('GetdistrictAndSubdistrictBystate', GET_DISTRICTS, { state: stateId });
        return NextResponse.json({
          success: true,
          districts: data?.data?.getdistrictAndSubdistrictBystate || [],
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err: unknown) {
    console.error('SHC Lookup Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'SHC lookup failed' },
      { status: 500 }
    );
  }
}
