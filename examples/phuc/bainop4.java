import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;
import java.util.StringTokenizer;

class Main {
    static class ListNode {
        int val;
        ListNode next;

        ListNode(int val) {
            this.val = val;
            this.next = null;
        }
    }

    static class FastLinkedList {
        private ListNode head;
        private ListNode tail;

        public void addLast(int val) {
            ListNode node = new ListNode(val);
            if (head == null) {
                head = tail = node;
            } else {
                tail.next = node;
                tail = node;
            }
        }

        // Tính tổng sử dụng đệ quy thay vì vòng lặp
        public long sumRecursive() {
            return computeSum(this.head);
        }

        private long computeSum(ListNode curr) {
            if (curr == null) return 0L;
            return curr.val + computeSum(curr.next);
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        if (line == null) return;
        
        int n = Integer.parseInt(line.trim());
        FastLinkedList list = new FastLinkedList();

        StringTokenizer st = new StringTokenizer(br.readLine());
        for (int i = 0; i < n; i++) {
            if (st.hasMoreTokens()) {
                list.addLast(Integer.parseInt(st.nextToken()));
            }
        }

        System.out.println(list.sumRecursive());
    }
}
