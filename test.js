async function test() {
  try {
    const res = await fetch('https://soilhealth4.dac.gov.in/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operationName: "GetState",
        variables: {},
        query: "query GetState($getStateId: String, $code: String) { getState(id: $getStateId, code: $code) }"
      })
    });
    const data = await res.json();
    console.log("STATES:", JSON.stringify(data).substring(0, 300));
  } catch (e) { console.error(e); }
}
test();
