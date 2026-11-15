import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;
import java.util.Arrays;
import java.util.Objects;
import java.util.Optional;
import java.util.function.BiFunction;
import java.util.function.Consumer;

class Main {

    public interface Functor<T> {
        <R> Functor<R> map(BiFunction<T, Integer, R> mapper);
    }

    public static abstract class FunctionalSequence<T> {
        public abstract boolean isNil();
        public abstract T head();
        public abstract FunctionalSequence<T> tail();
        public abstract long foldLeft(long initial, BiFunction<Long, T, Long> accumulator);
        
        public static <E> FunctionalSequence<E> empty() {
            return new Nil<>();
        }
        
        public static <E> FunctionalSequence<E> cons(E element, FunctionalSequence<E> rest) {
            return new Cons<>(element, rest);
        }
    }

    private static final class Nil<T> extends FunctionalSequence<T> {
        @Override public boolean isNil() { return true; }
        @Override public T head() { throw new UnsupportedOperationException("Nil head"); }
        @Override public FunctionalSequence<T> tail() { throw new UnsupportedOperationException("Nil tail"); }
        @Override public long foldLeft(long initial, BiFunction<Long, T, Long> accumulator) { return initial; }
    }

    private static final class Cons<T> extends FunctionalSequence<T> {
        private final T first;
        private final FunctionalSequence<T> restSequence;

        Cons(T first, FunctionalSequence<T> restSequence) {
            this.first = Objects.requireNonNull(first);
            this.restSequence = Objects.requireNonNull(restSequence);
        }

        @Override public boolean isNil() { return false; }
        @Override public T head() { return first; }
        @Override public FunctionalSequence<T> tail() { return restSequence; }
        @Override
        public long foldLeft(long initial, BiFunction<Long, T, Long> accumulator) {
            long current = accumulator.apply(initial, this.first);
            FunctionalSequence<T> ptr = this.restSequence;
            while (!ptr.isNil()) {
                current = accumulator.apply(current, ptr.head());
                ptr = ptr.tail();
            }
            return current;
        }
    }

    static final class InputParser {
        private final BufferedReader reader;

        InputParser(BufferedReader reader) {
            this.reader = reader;
        }

        public long[] parseData() throws IOException {
            String countLine = reader.readLine();
            if (countLine == null || countLine.trim().isEmpty()) return new long[0];
            int n = Integer.parseInt(countLine.trim());
            String dataLine = reader.readLine();
            if (dataLine == null) return new long[0];
            return Arrays.stream(dataLine.trim().split("\\s+"))
                         .mapToLong(Long::parseLong)
                         .toArray();
        }
    }

    public static void main(String[] args) throws IOException {
        InputParser parser = new InputParser(new BufferedReader(new InputStreamReader(System.in)));
        long[] numbers = parser.parseData();

        FunctionalSequence<Long> linkedSequence = FunctionalSequence.empty();
        for (int i = numbers.length - 1; i >= 0; i--) {
            linkedSequence = FunctionalSequence.cons(numbers[i], linkedSequence);
        }

        long aggregate = linkedSequence.foldLeft(0L, (acc, val) -> acc + val);
        System.out.println(aggregate);
    }
}
