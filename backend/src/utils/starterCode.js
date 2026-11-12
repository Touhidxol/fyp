import { LANGUAGE_IDS } from "../config/coding.js";

const STARTER_CODE = {
    python: String.raw`import sys

def main():
    data = sys.stdin.read().split()
    # TODO: solve the problem and print the answer


main()
`,

    javascript: String.raw`const lines = require('fs').readFileSync(0, 'utf8').split('\n');

// TODO: solve the problem and print the answer with console.log
`,

    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // TODO: read input with cin, print the answer with cout
    return 0;
}
`,

    java: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // TODO: read input with sc, print the answer with System.out.println
    }
}
`
};

export const starterCodeList = () =>
    LANGUAGE_IDS.map((language) => ({ language, code: STARTER_CODE[language] ?? "" }));