#include <iostream>
#include <vector>
#include <string>
#include <openssl/sha.h>
#include <sstream>
#include <iomanip>

std::string sha256(const std::string &input) {
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256((unsigned char*)input.c_str(), input.size(), hash);

    std::stringstream ss;
    for (int i = 0; i < SHA256_DIGEST_LENGTH; i++) {
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
    }
    return ss.str();
}

std::string buildMerkleRoot(std::vector<std::string> hashes) {
    if (hashes.empty()) return "";

    while (hashes.size() > 1) {
        std::vector<std::string> newLevel;

        for (size_t i = 0; i < hashes.size(); i += 2) {
            if (i + 1 < hashes.size()) {
                newLevel.push_back(sha256(hashes[i] + hashes[i + 1]));
            } else {
                newLevel.push_back(sha256(hashes[i] + hashes[i]));
            }
        }

        hashes = newLevel;
    }

    return hashes[0];
}

int main() {
    std::vector<std::string> messages = {
        "pay 100",
        "pay 200",
        "pay 300",
        "pay 400"
    };

    std::vector<std::string> hashes;

    for (auto &msg : messages) {
        hashes.push_back(sha256(msg));
    }

    std::string root = buildMerkleRoot(hashes);

    std::cout << "Merkle Root:\n" << root << std::endl;

    return 0;
}
