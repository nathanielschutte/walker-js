import sys

def main(word):
    chars = [c for c in word]
    a = []
    for i in range(len(chars)):
        for j in range(len(chars)):
            if (i != j):
                chars[i], chars[j] = chars[j], chars[i]
                a.append(''.join(chars))
                chars[i], chars[j] = chars[j], chars[i]
    print(len(a))

if __name__ == '__main__':
    if (len(sys.argv) < 2):
        print(f'Usage: {sys.argv[0]} <word>')
        sys.exit(1)
    main(sys.argv[1])
    