- [ ] Fix login/signup generic "Something went wrong" masking real API error detail
  - [ ] Update frontend AuthContext.jsx formatApiErrorDetail to prefer response.data.detail and status codes
  - [ ] Update login/register pages to display correct detail for Axios errors
  - [ ] Add/confirm backend error responses always use consistent `detail` field (no bare exceptions)
  - [ ] Run frontend unit/e2e tests if present + manual login/register flows to verify message disappears

