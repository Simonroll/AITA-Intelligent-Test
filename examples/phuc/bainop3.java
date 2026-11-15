import java.util.Scanner;

class Main {
    static class NodeItem {
        int val;
        NodeItem nextNode;

        NodeItem(int val) {
            this.val = val;
            this.nextNode = null;
        }
    }

    static class MyLinkedList {
        NodeItem headNode;
        NodeItem tailNode;

        public boolean isEmpty() {
            return headNode == null;
        }

        public void pushBack(int x) {
            NodeItem p = new NodeItem(x);
            if (this.headNode == null) {
                this.headNode = p;
                this.tailNode = p;
            } else {
                this.tailNode.nextNode = p;
                this.tailNode = p;
            }
        }

        public long getSum() {
            long ans = 0;
            for (NodeItem cur = this.headNode; cur != null; cur = cur.nextNode) {
                ans += cur.val;
            }
            return ans;
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int count = sc.nextInt();
            MyLinkedList list = new MyLinkedList();
            int idx = 0;
            while (idx < count) {
                list.pushBack(sc.nextInt());
                idx++;
            }
            long res = list.getSum();
            System.out.println(res);
        }
        sc.close();
    }
}
