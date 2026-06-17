import { createMemo, createSignal, Show, type Component } from 'solid-js';
import CopyButton from './CopyButton.jsx';
import CodeBlock from './CodeBlock.jsx';

interface Props {
  apiKey: string | null;
  keyPrefix: string | null;
  baseUrl: string;
}

const EyeIcon: Component<{ open: boolean }> = (props) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <Show
      when={props.open}
      fallback={
        <>
          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
          <circle cx="12" cy="12" r="3" />
        </>
      }
    >
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </Show>
  </svg>
);

function tomlString(value: string): string {
  return JSON.stringify(value);
}

function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function codexBaseUrl(baseUrl: string): string {
  try {
    const url = new URL(baseUrl);
    if ((url.hostname === '127.0.0.1' || url.hostname === 'localhost') && url.port === '3000') {
      url.hostname = '127.0.0.1';
      url.port = '3001';
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return baseUrl;
  }
}

function getCodexConfig(baseUrl: string): string {
  return `model = "auto"
model_provider = "manifest"

[model_providers.manifest]
name = "Manifest"
base_url = ${tomlString(codexBaseUrl(baseUrl))}
wire_api = "responses"
supports_websockets = false
env_key = "MANIFEST_API_KEY"`;
}

const CodexSetup: Component<Props> = (props) => {
  const [keyRevealed, setKeyRevealed] = createSignal(false);

  const placeholderKey = 'mnfst_YOUR_KEY';
  const hasFullKey = () => !!props.apiKey;
  const masked = () => (props.keyPrefix ? `${props.keyPrefix}...` : placeholderKey);
  const copyKey = () => props.apiKey ?? placeholderKey;
  const visibleKey = () => {
    if (!props.apiKey) return placeholderKey;
    return keyRevealed() ? props.apiKey : masked();
  };

  const configSnippet = createMemo(() => getCodexConfig(props.baseUrl));
  const envCommandCopy = () => `launchctl setenv MANIFEST_API_KEY ${shellSingleQuote(copyKey())}`;
  const envCommandShown = () =>
    `launchctl setenv MANIFEST_API_KEY ${shellSingleQuote(visibleKey())}`;

  return (
    <div class="setup-agents-card">
      <p class="setup-method__hint">
        Add this block to <code class="setup-model-hint__code">~/.codex/config.toml</code>. Codex
        will use Manifest's auto route over the Responses API.
      </p>

      <CodeBlock code={configSnippet()} language="toml" />

      <p class="setup-method__hint" style="margin-top: 12px;">
        Run this once so the macOS app can read the Manifest key, then reopen Codex.
      </p>

      <div class="setup-cli-block">
        <div class="setup-cli-block__actions">
          <Show when={hasFullKey()}>
            <button
              class="modal-terminal__copy"
              onClick={() => setKeyRevealed(!keyRevealed())}
              aria-label={keyRevealed() ? 'Hide API key' : 'Reveal API key'}
              title={keyRevealed() ? 'Hide key' : 'Reveal key'}
            >
              <EyeIcon open={keyRevealed()} />
            </button>
          </Show>
          <CopyButton text={envCommandCopy()} />
        </div>
        <CodeBlock code={envCommandShown()} language="bash" copyText={envCommandCopy()} />
      </div>
    </div>
  );
};

export default CodexSetup;
