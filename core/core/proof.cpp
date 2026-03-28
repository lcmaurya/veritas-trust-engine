#include <iostream>
#include <vector>
#include <string>
#include <openssl/sha.h>
#include <sstream>
#include <iomanip>

// 🔹 SHA256
std::string sha256(const std::string &input) {
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256((unsigned char*)input.c_str(), input.size(), hash);

    std::stringstream ss;
    for (int i = 0; i < SHA256_DIGEST_LENGTH; i++) {
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
    }
    return ss.str();
}

// 🔹 Build Tree Levels
std::vector<std::vector<std::string>> buildTree(std::vector<std::string> hashes) {
    std::vector<std::vector<std::string>> tree;
    tree.push_back(hashes);

    while (hashes.size() > 1) {
        std::vector<std::string> next;

        for (size_t i = 0; i < hashes.size(); i += 2) {
            if (i + 1 < hashes.size()) {
                next.push_back(sha256(hashes[i] + hashes[i + 1]));
            } else {
                next.push_back(sha256(hashes[i] + hashes[i]));
            }
        }

        tree.push_back(next);
        hashes = next;
    }

    return tree;
}

// 🔹 Generate Proof
std::vector<std::string> getProof(const std::vector<std::vector<std::string>> &tree, int index) {
    std::vector<std::string> proof;

    for (size_t level = 0; level < tree.size() - 1; level++) {
        int sibling = (index % 2 == 0) ? index + 1 : index - 1;

        if (sibling < tree[level].size()) {
            proof.push_back(tree[level][sibling]);
        }

        index /= 2;
    }

    return proof;
}

// 🔹 Verify Proof
bool verifyProof(std::string leaf, std::vector<std::string> proof, std::string root, int index) {
    std::string hash = leaf;

    for (auto &p : proof) {
        if (index % 2 == 0) {
            hash = sha256(hash + p);
        } else {
            hash = sha256(p + hash);
        }
        index /= 2;
    }

    return hash == root;
}

// 🔹 MAIN
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

    auto tree = buildTree(hashes);

    std::string root = tree.back()[0];

    int index = 2; // "pay 300"

    auto proof = getProof(tree, index);

    bool result = verifyProof(hashes[index], proof, root, index);

    std::cout << "Merkle Root:\n" << root << "\n\n";

    std::cout << "Proof:\n";
    for (auto &p : proof) {
        std::cout << p << std::endl;
    }

    std::cout << "\nVerification: " << (result ? "VERIFIED" : "FAILED") << std::endl;

    return 0;
}
