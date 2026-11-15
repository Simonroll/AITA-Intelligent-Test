import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;
import java.util.Iterator;
import java.util.NoSuchElementException;
import java.util.StringTokenizer;

class Main {
    static class DNode<T> {
        T data;
        DNode<T> prev;
        DNode<T> next;

        DNode(T data) {
            this.data = data;
        }
    }

    static class DoublyLinkedList<T> implements Iterable<T> {
        private DNode<T> head;
        private DNode<T> tail;
        private int size = 0;

        public void add(T value) {
            DNode<T> node = new DNode<>(value);
            if (tail == null) {
                head = tail = node;
            } else {
                tail.next = node;
                node.prev = tail;
                tail = node;
            }
            size++;
        }

        public int size() {
            return size;
        }

        @Override
        public Iterator<T> iterator() {
            return new Iterator<T>() {
                private DNode<T> current = head;

                @Override
                public boolean hasNext() {
                    return current != null;
                }

                @Override
                public T next() {
                    if (!hasNext()) throw new NoSuchElementException();
                    T val = current.data;
                    current = current.next;
                    return val;
                }
            };
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String line = reader.readLine();
        if (line == null || line.trim().isEmpty()) return;

        int n = Integer.parseInt(line.trim());
        DoublyLinkedList<Integer> dll = new DoublyLinkedList<>();

        StringTokenizer tokenizer = new StringTokenizer(reader.readLine());
        while (tokenizer.hasMoreTokens()) {
            dll.add(Integer.parseInt(tokenizer.nextToken()));
        }

        long totalSum = 0;
        for (int value : dll) {
            totalSum += value;
        }

        System.out.println(totalSum);
    }
}
