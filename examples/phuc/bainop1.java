import java.util.Scanner;

class Main {
    static class Node {
        int data;
        Node next;

        Node(int data) {
            this.data = data;
            this.next = null;
        }
    }

    static class SinglyLinkedList {
        Node head;
        Node tail;

        SinglyLinkedList() {
            this.head = null;
            this.tail = null;
        }

        void append(int value) {
            Node newNode = new Node(value);
            if (this.head == null) {
                this.head = newNode;
                this.tail = newNode;
            } else {
                this.tail.next = newNode;
                this.tail = newNode;
            }
        }

        long calculateSum() {
            long sum = 0;
            Node current = this.head;
            while (current != null) {
                sum += current.data;
                current = current.next;
            }
            return sum;
        }
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNextInt()) {
            int n = scanner.nextInt();
            SinglyLinkedList list = new SinglyLinkedList();
            for (int i = 0; i < n; i++) {
                list.append(scanner.nextInt());
            }
            System.out.println(list.calculateSum());
        }
        scanner.close();
    }
}
