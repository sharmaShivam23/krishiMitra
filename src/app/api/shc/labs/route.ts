import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

const API_URL = 'https://soilhealth4.dac.gov.in/graphql';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const stateId = searchParams.get('stateId');
  const districtId = searchParams.get('districtId');

  try {
    let operationName = '';
    let variables: any = {};
    let query = '';

    if (type === 'states') {
      operationName = 'GetState';
      query = 'query GetState($getStateId: String, $code: String) { getState(id: $getStateId, code: $code) }';
      variables = {};
    } else if (type === 'districts') {
      if (!stateId) return NextResponse.json({ success: false, error: 'Missing stateId' }, { status: 400 });
      operationName = 'GetdistrictAndSubdistrictBystate';
      query = `query GetdistrictAndSubdistrictBystate($getdistrictAndSubdistrictBystateId: String, $name: String, $state: ID, $subdistrict: Boolean, $code: String, $aspirationaldistrict: Boolean) {
        getdistrictAndSubdistrictBystate(id: $getdistrictAndSubdistrictBystateId, name: $name, state: $state, subdistrict: $subdistrict, code: $code, aspirationaldistrict: $aspirationaldistrict)
      }`;
      variables = { state: stateId };
    } else if (type === 'labs') {
      if (!stateId || !districtId) return NextResponse.json({ success: false, error: 'Missing stateId or districtId' }, { status: 400 });
      operationName = 'GetTestCenters';
      query = `query GetTestCenters($state: String, $district: String) {
        getTestCenters(state: $state, district: $district) {
          district
          email
          name
          STLdetails { phone }
          state
          region
          address
        }
      }`;
      variables = { state: stateId, district: districtId };
    } else {
      return NextResponse.json({ success: false, error: 'Invalid type parameter' }, { status: 400 });
    }

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://www.soilhealth.dac.gov.in',
        'Referer': 'https://www.soilhealth.dac.gov.in/',
      },
      body: JSON.stringify({ operationName, variables, query })
    });

    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();

    // Map responses to generic shapes
    if (type === 'states') {
      const rawStates = data?.data?.getState || [];
      const parsed = rawStates.map((obj: any) => ({
        id: obj.id || obj._id,
        name: obj.name || obj.stateName
      }));
      return NextResponse.json({ success: true, data: parsed });
    } 
    else if (type === 'districts') {
      const rawDistricts = data?.data?.getdistrictAndSubdistrictBystate || [];
      const parsed = rawDistricts.map((obj: any) => ({
        id: obj.id || obj._id,
        name: obj.name || obj.districtName
      }));
      return NextResponse.json({ success: true, data: parsed });
    } 
    else if (type === 'labs') {
      const labs = data?.data?.getTestCenters || [];
      return NextResponse.json({ success: true, data: labs });
    }

  } catch (error: any) {
    console.error('SHC Proxy Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
