import java.util.Scanner;

// ==============================================================
// PHẦN MỀM XỬ LÝ DANH SÁCH LIÊN KẾT ĐƠN - SINH VIÊN B
// Tự lập trình, không sao chép bài của bạn khác
// ==============================================================

class Main {
    // Lớp phần tử danh sách liên kết
    static class ElementItem {
        int itemValue;
        ElementItem linkNext;

        ElementItem(int itemValue) {
            this.itemValue = itemValue;
            this.linkNext = null;
        }
    }

    // Lớp quản lý chuỗi liên kết
    static class ChainCollection {
        ElementItem firstElement;
        ElementItem lastElement;

        ChainCollection() {
            this.firstElement = null;
            this.lastElement = null;
        }

        // Chèn thêm một phần tử vào cuối
        void insertTail(int elementVal) {
            ElementItem freshItem = new ElementItem(elementVal);
            if (this.firstElement == null) {
                this.firstElement = freshItem;
                this.lastElement = freshItem;
            } else {
                this.lastElement.linkNext = freshItem;
                this.lastElement = freshItem;
            }
        }

        // Tính tổng toàn bộ phần tử trong danh sách
        long aggregateTotal() {
            long totalAmount = 0;
            ElementItem traversalCursor = this.firstElement;
            while (traversalCursor != null) {
                totalAmount += traversalCursor.itemValue;
                traversalCursor = traversalCursor.linkNext;
            }
            return totalAmount;
        }
    }

    public static void main(String[] executionArgs) {
        Scanner inputReader = new Scanner(System.in);
        if (inputReader.hasNextInt()) {
            int totalElements = inputReader.nextInt();
            ChainCollection collectionInstance = new ChainCollection();
            for (int iterationIndex = 0; iterationIndex < totalElements; iterationIndex++) {
                collectionInstance.insertTail(inputReader.nextInt());
            }
            System.out.println(collectionInstance.aggregateTotal());
        }
        inputReader.close();
    }
}
