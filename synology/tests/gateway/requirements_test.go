//go:build requirements

package proof

import "testing"

// Product requirements use explicit provider-only admission. Published pins stay
// unchanged until the source capabilities are released.
func TestRequiredProviderOnlyOIDC(t *testing.T) {
	_, _, err := front(t, "dsm-admins", nil, true)
	if err != nil {
		t.Fatalf("embedded OIDC must coexist with upstream-owned admission: %v", err)
	}
}

func TestRequiredNativeTokenTransportWithoutDSMPreauthentication(t *testing.T) {
	f, _, err := front(t, "dsm-admins", nil, true)
	if err != nil {
		t.Fatal(err)
	}
	if got := request(f, "POST", "/identity/connect/token", ""); got != 418 {
		t.Fatalf("native token POST must reach upstream without a browser Origin or DSM cookie; got %d", got)
	}
}
