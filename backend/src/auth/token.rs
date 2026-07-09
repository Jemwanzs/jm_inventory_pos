use rand::Rng;
use sha2::{Digest, Sha256};

/// A high-entropy, URL-safe invite token. Security comes from the entropy
/// here, not from the hash below — a fast hash is fine for lookup.
pub fn generate_invite_token() -> String {
    const CHARSET: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let mut rng = rand::thread_rng();
    (0..40).map(|_| CHARSET[rng.gen_range(0..CHARSET.len())] as char).collect()
}

/// Hashes a token for storage, mirroring why we never store raw passwords —
/// a database leak shouldn't hand out usable invite links.
pub fn hash_token(token: &str) -> String {
    let digest = Sha256::digest(token.as_bytes());
    digest.iter().map(|byte| format!("{byte:02x}")).collect()
}
