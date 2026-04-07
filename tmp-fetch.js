const fetch = require('node-fetch');

async function test() {
  const res = await fetch('https://soilhealth4.dac.gov.in/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operationName: "GetState",
      variables: {},
      query: "query GetState($getStateId: String, $code: String) { getState(id: $getStateId, code: $code) }"
    })
  });
  const text = await res.text();
  console.log("STATES:", text.substring(0, 500));

  const res2 = await fetch('https://soilhealth4.dac.gov.in/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operationName: "GetdistrictAndSubdistrictBystate",
      variables: { state: "17" },
      query: "query GetdistrictAndSubdistrictBystate($getdistrictAndSubdistrictBystateId: String, $name: String, $state: ID, $subdistrict: Boolean, $code: String, $aspirationaldistrict: Boolean) { getdistrictAndSubdistrictBystate(id: $getdistrictAndSubdistrictBystateId, name: $name, state: $state, subdistrict: $subdistrict, code: $code, aspirationaldistrict: $aspirationaldistrict) }"
    })
  });
  const text2 = await res2.text();
  console.log("\nDISTRICTS:", text2.substring(0, 500));
}
test();
