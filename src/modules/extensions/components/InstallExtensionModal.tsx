import { useState, useCallback } from 'react';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import { Modal, ModalFooter, Button, Input } from '@/components/ui';
import { useExtensionStore } from '../stores/useExtensionStore';

interface InstallExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  extensionSlug: string;
  extensionName: string;
}

export function InstallExtensionModal({
  isOpen,
  onClose,
  extensionSlug,
  extensionName,
}: InstallExtensionModalProps): React.ReactNode {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [configJson, setConfigJson] = useState('');
  const [callbackToken, setCallbackToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const install = useExtensionStore((s) => s.install);
  const saving = useExtensionStore((s) => s.saving);

  const handleInstall = useCallback(async () => {
    setError(null);
    let config: Record<string, unknown> | undefined;

    if (configJson.trim()) {
      try {
        config = JSON.parse(configJson) as Record<string, unknown>;
      } catch {
        setError('Invalid JSON in config field');
        return;
      }
    }

    try {
      const instance = await install({
        slug: extensionSlug,
        webhook_url: webhookUrl,
        config,
      });
      setCallbackToken(instance.callback_token ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to install extension');
    }
  }, [extensionSlug, webhookUrl, configJson, install]);

  const handleCopy = useCallback(async () => {
    if (!callbackToken) return;
    await navigator.clipboard.writeText(callbackToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [callbackToken]);

  const handleClose = useCallback(() => {
    setWebhookUrl('');
    setConfigJson('');
    setCallbackToken(null);
    setCopied(false);
    setError(null);
    onClose();
  }, [onClose]);

  const isFormValid = webhookUrl.trim().length > 0;

  return (
    <Modal isOpen={isOpen} onClose={callbackToken ? handleClose : onClose} title={callbackToken ? 'Installation Complete' : `Install ${extensionName}`}>
      {callbackToken ? (
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Save this callback token now. It cannot be retrieved again.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-700">Callback Token</p>
            <div className="flex gap-2">
              <code className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono break-all text-gray-700">
                {callbackToken}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                aria-label="Copy callback token"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <ModalFooter>
            <Button variant="primary" size="sm" onClick={handleClose}>
              Done
            </Button>
          </ModalFooter>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="webhook-url" className="text-xs font-medium text-gray-700">
              Webhook URL <span className="text-red-500">*</span>
            </label>
            <Input
              id="webhook-url"
              placeholder="https://my-extension.example.com/webhook"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <p className="text-xs text-gray-400">
              URL where Core will send event data to the extension.
            </p>
          </div>
          <div className="space-y-1">
            <label htmlFor="config-json" className="text-xs font-medium text-gray-700">
              Config (optional JSON)
            </label>
            {/* eslint-disable-next-line no-restricted-syntax -- textarea is not in ui barrel */}
            <textarea
              id="config-json"
              className="w-full min-h-[80px] p-2 text-sm font-mono border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder='{ "region": "US" }'
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
          <ModalFooter>
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleInstall}
              disabled={!isFormValid || saving}
            >
              {saving ? 'Installing...' : 'Install'}
            </Button>
          </ModalFooter>
        </div>
      )}
    </Modal>
  );
}
