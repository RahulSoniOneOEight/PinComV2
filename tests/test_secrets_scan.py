from pathlib import Path
import secrets as _secrets
import tempfile
import unittest

from tooling.security.secrets_scan import find_secret, scan


def _token() -> str:
    # Built at runtime so this test file itself never contains a matchable literal.
    return "sk-live-" + _secrets.token_hex(12)


def _env_line(key: str, value: str) -> str:
    return key + "=" + value + "\n"


def _quoted_line(key: str, value: str) -> str:
    return key + ' = "' + value + '"\n'


class SecretsScanTests(unittest.TestCase):
    def _scan_text(self, name: str, text: str) -> list[str]:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / name).write_text(text, encoding="utf-8")
            return scan(root)

    def test_root_env_with_realistic_secret_is_detected(self):
        findings = self._scan_text(".env", _env_line("OPENAI_API_KEY", _token()))
        self.assertIn(".env", findings)

    def test_env_variants_are_detected(self):
        for name in (".env.local", ".env.production", "foo.env"):
            with self.subTest(name=name):
                findings = self._scan_text(name, _env_line("API_KEY", _token()))
                self.assertIn(name, findings)

    def test_quoted_secret_in_env_is_detected(self):
        findings = self._scan_text(".env", _quoted_line("API_KEY", _token()))
        self.assertIn(".env", findings)

    def test_example_env_files_are_ignored(self):
        for name in (".env.example", ".env.sample", ".env.template", "foo.env.dist"):
            with self.subTest(name=name):
                findings = self._scan_text(name, _env_line("API_KEY", _token()))
                self.assertEqual(findings, [])

    def test_placeholder_values_are_not_flagged(self):
        text = (
            _env_line("API_KEY", "your_api_key_here_1234567890")
            + _env_line("SECRET", "change-me-before-deploy")
            + _env_line("PASSWORD", "<insert-password>")
            + _env_line("TOKEN", "${VAULT_TOKEN}")
        )
        self.assertEqual(self._scan_text(".env", text), [])

    def test_quoted_secret_in_source_is_detected(self):
        findings = self._scan_text("config.py", _quoted_line("api_key", _token()))
        self.assertIn("config.py", findings)

    def test_variable_references_are_not_flagged(self):
        code = (
            "args.tryton_token\n"
            "config = ProviderConfig(token=args.tryton_token)\n"
            "password = os.getenv('DB_PASSWORD')\n"
        )
        self.assertEqual(self._scan_text("live_reference.py", code), [])

    def test_aws_access_key_is_detected(self):
        aws_key = "AKIA" + "IOSFODNN7EXAMPLE"
        findings = self._scan_text("creds.py", _quoted_line("AWS", aws_key))
        self.assertIn("creds.py", findings)

    def test_clean_file_is_not_flagged(self):
        self.assertEqual(self._scan_text(".env", _env_line("FEATURE_FLAG", "enabled")), [])

    def test_find_secret_respects_unquoted_flag(self):
        text = _env_line("token", _token())
        self.assertIsNotNone(find_secret(text, allow_unquoted=True))
        self.assertIsNone(find_secret(text, allow_unquoted=False))


if __name__ == "__main__":
    unittest.main()
