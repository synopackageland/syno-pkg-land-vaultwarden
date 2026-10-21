//go:build requirements

package proof

import "testing"

// These are product acceptance requirements. They intentionally stay red while
// SDK 0.21.0 cannot express provider-only admission; diagnostic tests are separate.
func TestRequiredProviderOnlyOIDC(t *testing.T) {
	_, _, err := front(t, "public", nil)
	if err != nil {
		t.Fatalf("embedded OIDC must coexist with upstream-owned admission: %v", err)
	}
}

func TestRequiredNativeTokenTransportWithoutDSMPreauthentication(t *testing.T) {
	f, _, err := front(t, "", nil)
	if err != nil {
		t.Fatal(err)
	}
	if got := request(f, "POST", "/identity/connect/token", ""); got != 418 {
		t.Fatalf("native token POST must reach upstream without a browser Origin or DSM cookie; got %d", got)
	}
}
