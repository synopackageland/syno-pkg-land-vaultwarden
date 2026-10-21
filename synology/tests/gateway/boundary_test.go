package proof

import (
	"context"
	"crypto/tls"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	gateway "github.com/synopackageland/syno-pkg-land-sdk/idgateway"
)

func front(t *testing.T, access string, passthrough []string, providerOnly ...bool) (http.Handler, *int, error) {
	t.Helper()
	calls := new(int)
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		(*calls)++
		w.WriteHeader(http.StatusTeapot) // Recognizable upstream response, not a login page.
	}))
	t.Cleanup(upstream.Close)
	key, err := gateway.LoadOrCreateSigningKey(t.TempDir() + "/signing.pem")
	if err != nil {
		t.Fatal(err)
	}
	provider, err := gateway.NewProvider("http://127.0.0.1:29090", "dsm.invalid", key,
		[]gateway.Client{{ID: "vaultwarden", SecretSHA256: make([]byte, 32), RedirectPaths: []string{"/identity/connect/oidc-signin"}}}, nil)
	if err != nil {
		t.Fatal(err)
	}
	upstreamAccess := ""
	if len(providerOnly)>0 && providerOnly[0] {upstreamAccess="public"}
	f, err := gateway.NewFront(gateway.FrontConfig{
		Package: "SynoPkgVaultwarden", Upstream: upstream.URL,
		Key: []byte(strings.Repeat("fixture-", 8)), Mode: gateway.ModeOIDC,
		Access: access, UpstreamAccess: upstreamAccess, Passthrough: passthrough, Provider: provider,
		Issuer: "http://127.0.0.1:29090", AuthorizeCGI: "/webman/3rdparty/SynoPkgVaultwarden/sso/authorize.cgi",
		DSMPorts: gateway.DSMPorts{HTTP: 5000, HTTPS: 5001},
	})
	return f, calls, err
}

func request(handler http.Handler, method, path, origin string) int {
	r := httptest.NewRequest(method, "https://vault.example:29443"+path, strings.NewReader("grant_type=authorization_code"))
	r.TLS = &tls.ConnectionState{}
	r.RemoteAddr = "203.0.113.5:1234"
	r.Header.Set("Accept", "application/json")
	if origin != "" {
		r.Header.Set("Origin", origin)
	}
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r.WithContext(context.Background()))
	return w.Code
}

func TestPublicOIDCRejected(t *testing.T) {
	_, _, err := front(t, "public", nil)
	if err == nil || !strings.Contains(err.Error(), "public access requires mode none") {
		t.Fatalf("expected provider-only blocker, got %v", err)
	}
}

func TestNativeClientNeverReachesVaultwardenWithDefaultGate(t *testing.T) {
	f, calls, err := front(t, "dsm-admins", nil)
	if err != nil {
		t.Fatal(err)
	}
	if got := request(f, "GET", "/api/config", ""); got != 401 {
		t.Fatalf("config: %d", got)
	}
	if got := request(f, "POST", "/identity/connect/token", ""); got != 403 {
		t.Fatalf("native token: %d", got)
	}
	if *calls != 0 {
		t.Fatal("DSM-gated requests unexpectedly reached upstream")
	}
}

func TestLegacyEmptyAccessIsNotANativeClientSolution(t *testing.T) {
	f, calls, err := front(t, "", nil)
	if err != nil {
		t.Fatal(err)
	}
	if got := request(f, "GET", "/api/config", ""); got != 418 {
		t.Fatalf("legacy GET control: %d", got)
	}
	if got := request(f, "POST", "/identity/connect/token", ""); got != 403 {
		t.Fatalf("legacy native POST: %d", got)
	}
	if got := request(f, "POST", "/identity/connect/token", "https://vault.example:29443"); got != 418 {
		t.Fatalf("browser POST control: %d", got)
	}
	if *calls != 2 {
		t.Fatalf("upstream calls: %d", *calls)
	}
}

func TestPrefixExceptionWouldChangeTheAuthenticationBoundary(t *testing.T) {
	f, calls, err := front(t, "dsm-admins", []string{"/api", "/identity"})
	if err != nil {
		t.Fatal(err)
	}
	if got := request(f, "POST", "/identity/connect/token", ""); got != 418 {
		t.Fatalf("passthrough positive control: %d", got)
	}
	if got := request(f, "GET", "/", ""); got != 401 {
		t.Fatalf("root still gated: %d", got)
	}
	if *calls != 1 {
		t.Fatalf("upstream calls: %d", *calls)
	}
}
