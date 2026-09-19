from __future__ import annotations

import hashlib
import hmac


def verify_hmac_sha256(
    *,
    secret: str,
    body: bytes,
    supplied_signature: str,
    prefix: str = "",
) -> bool:
    expected = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    signature = supplied_signature
    if prefix and signature.startswith(prefix):
        signature = signature[len(prefix):]
    return hmac.compare_digest(expected, signature)


def verify_razorpay_signature(
    *,
    secret: str,
    body: bytes,
    supplied_signature: str,
) -> bool:
    return verify_hmac_sha256(
        secret=secret,
        body=body,
        supplied_signature=supplied_signature,
    )


def verify_generic_webhook_signature(
    *,
    secret: str,
    body: bytes,
    supplied_signature: str,
) -> bool:
    return verify_hmac_sha256(
        secret=secret,
        body=body,
        supplied_signature=supplied_signature,
        prefix="sha256=",
    )
