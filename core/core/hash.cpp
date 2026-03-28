#include <iostream>
#include <string>
#include <openssl/sha.h>
#include <sstream>
#include <iomanip>

// normalize
std::string normalize(const std::string &input) {
    std::string out;
    bool space = false;

    for (char c : input) {
        if (isspace(c)) {
            if (!space) {
                out += ' ';
                space = true;
            }
        } else {
            out += tolower(c);
            space = false;
        }
    }

    if (!out.empty() && out.front() == ' ') out.erase(0, 1);
    if (!out.empty() && out.back() == ' ') out.pop_back();

    return out;
}

// sha256
std::string sha256(const std::string &input) {
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256((unsigned char*)input.c_str(), input.size(), hash);

    std::stringstream ss;
    for (int i = 0; i < SHA256_DIGEST_LENGTH; i++) {
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
    }
    return ss.str();
}

int main() {
    std::string message;
    std::getline(std::cin, message);

    std::string normalized = normalize(message);
    std::string hash = sha256(normalized);

    // CLEAN OUTPUT (important)
    std::cout << normalized << "|" << hash;

    return 0;
}
