package com.meokgo.server.domain.story.service;

import com.meokgo.server.global.error.BusinessException;
import com.meokgo.server.global.error.ErrorCode;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.font.TextLayout;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import java.util.List;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

/**
 * 이미지 헤더와 픽셀 수를 먼저 검사하고 사진과 텍스트를 9:16 카드로 합성한다.
 * 업로드 이미지는 PNG로 다시 인코딩하여 원본 메타데이터를 저장하지 않는다.
 *
 * @author 정효림
 */
@Component
public class StoryImageRenderer {
    private static final int WIDTH = 1080;
    private static final int HEIGHT = 1920;
    private static final long MAX_PIXELS = 20_000_000;
    private static final long MAX_BYTES = 10 * 1024 * 1024;
    private final String fontFamily;

    public StoryImageRenderer(@Value("${app.story.font-family:SansSerif}") String fontFamily) {
        this.fontFamily = fontFamily;
    }

    public byte[] normalize(MultipartFile file) {
        if (file.isEmpty() || file.getSize() > MAX_BYTES) {
            throw new BusinessException(ErrorCode.FILE_INVALID);
        }
        try {
            BufferedImage original = decode(file.getBytes());
            double scale = Math.min(1.0, 2048.0 / Math.max(original.getWidth(), original.getHeight()));
            int width = Math.max(1, (int) Math.round(original.getWidth() * scale));
            int height = Math.max(1, (int) Math.round(original.getHeight() * scale));
            BufferedImage normalized = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            Graphics2D graphics = normalized.createGraphics();
            try {
                graphics.setColor(Color.WHITE);
                graphics.fillRect(0, 0, normalized.getWidth(), normalized.getHeight());
                graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                graphics.drawImage(original, 0, 0, width, height, null);
            } finally {
                graphics.dispose();
            }
            return png(normalized);
        } catch (IOException exception) {
            throw new BusinessException(ErrorCode.FILE_INVALID);
        }
    }

    public BufferedImage decode(byte[] bytes) {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) {
                throw new BusinessException(ErrorCode.FILE_INVALID);
            }
            ImageReader reader = readers.next();
            try {
                String format = reader.getFormatName();
                if (!format.equalsIgnoreCase("png") && !format.equalsIgnoreCase("jpeg")) {
                    throw new BusinessException(ErrorCode.FILE_INVALID);
                }
                reader.setInput(input, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width < 1 || height < 1 || (long) width * height > MAX_PIXELS) {
                    throw new BusinessException(ErrorCode.FILE_INVALID);
                }
                return reader.read(0);
            } finally {
                reader.dispose();
            }
        } catch (IOException | IllegalArgumentException exception) {
            throw new BusinessException(ErrorCode.FILE_INVALID);
        }
    }

    public byte[] render(List<BufferedImage> photos, String region, String date,
            List<String> quests, String memo) {
        BufferedImage canvas = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = canvas.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            graphics.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            graphics.setColor(new Color(255, 248, 232));
            graphics.fillRect(0, 0, WIDTH, HEIGHT);
            graphics.setColor(new Color(35, 51, 41));
            graphics.setFont(new Font(fontFamily, Font.BOLD, 54));
            fitText(graphics, "먹으러GO · " + region, 72, 112, 936);
            graphics.setFont(new Font(fontFamily, Font.PLAIN, 30));
            drawText(graphics, date, 72, 164);
            int count = photos.size();
            int columns = count > 1 ? 2 : 1;
            int rows = count > 2 ? 2 : 1;
            int cellWidth = (936 - (columns - 1) * 16) / columns;
            int cellHeight = (1024 - (rows - 1) * 16) / rows;
            for (int index = 0; index < count; index++) {
                drawPhoto(graphics, photos.get(index), 72 + (index % columns) * (cellWidth + 16),
                        220 + (index / columns) * (cellHeight + 16), cellWidth, cellHeight);
            }
            graphics.setColor(new Color(35, 51, 41));
            graphics.setFont(new Font(fontFamily, Font.BOLD, 38));
            drawText(graphics, "오늘 완료한 퀘스트", 72, 1320);
            graphics.setFont(new Font(fontFamily, Font.PLAIN, 32));
            if (quests.isEmpty()) {
                drawText(graphics, "함께한 탐험을 기록했어요.", 72, 1384);
            } else {
                for (int index = 0; index < quests.size(); index++) {
                    fitText(graphics, (index + 1) + ". " + quests.get(index), 72, 1384 + index * 58, 936);
                }
            }
            if (memo != null && !memo.isBlank()) {
                graphics.setFont(new Font(fontFamily, Font.PLAIN, 30));
                drawWrapped(graphics, memo, 72, 1610, 936, 42, 5);
            }
            graphics.setFont(new Font(fontFamily, Font.BOLD, 28));
            drawText(graphics, "새로운 맛과 장소를 발견한 하루", 72, 1848);
        } finally {
            graphics.dispose();
        }
        return png(canvas);
    }

    public byte[] preview() {
        BufferedImage placeholder = new BufferedImage(800, 800, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = placeholder.createGraphics();
        try {
            graphics.setColor(new Color(205, 225, 204));
            graphics.fillRect(0, 0, 800, 800);
            graphics.setColor(new Color(35, 51, 41));
            graphics.setFont(new Font(fontFamily, Font.BOLD, 64));
            drawText(graphics, "오늘의 탐험 사진", 120, 420);
        } finally {
            graphics.dispose();
        }
        return render(List.of(placeholder), "탐험 지역", "탐험 날짜", List.of("새로운 메뉴 주문하기"), "오늘의 기억을 남겨보세요.");
    }

    private void drawPhoto(Graphics2D graphics, BufferedImage image, int x, int y, int width, int height) {
        double scale = Math.max((double) width / image.getWidth(), (double) height / image.getHeight());
        int sourceWidth = Math.min(image.getWidth(), (int) Math.round(width / scale));
        int sourceHeight = Math.min(image.getHeight(), (int) Math.round(height / scale));
        int left = (image.getWidth() - sourceWidth) / 2;
        int top = (image.getHeight() - sourceHeight) / 2;
        graphics.drawImage(image, x, y, x + width, y + height, left, top, left + sourceWidth, top + sourceHeight, null);
    }

    private void drawText(Graphics2D graphics, String text, int x, int y) {
        if (!text.isEmpty()) {
            new TextLayout(text, graphics.getFont(), graphics.getFontRenderContext()).draw(graphics, x, y);
        }
    }

    private void fitText(Graphics2D graphics, String value, int x, int y, int maxWidth) {
        FontMetrics metrics = graphics.getFontMetrics();
        String result = value;
        while (!result.isEmpty() && metrics.stringWidth(result) > maxWidth) {
            result = result.substring(0, result.offsetByCodePoints(result.length(), -1));
        }
        if (!result.equals(value)) {
            while (!result.isEmpty() && metrics.stringWidth(result + "…") > maxWidth) {
                result = result.substring(0, result.offsetByCodePoints(result.length(), -1));
            }
            result += "…";
        }
        drawText(graphics, result, x, y);
    }

    private void drawWrapped(Graphics2D graphics, String text, int x, int y, int width, int lineHeight, int maxLines) {
        StringBuilder line = new StringBuilder();
        FontMetrics metrics = graphics.getFontMetrics();
        int row = 0;
        int[] points = text.codePoints().toArray();
        for (int index = 0; index < points.length; index++) {
            String character = new String(Character.toChars(points[index]));
            if (points[index] == '\n' || metrics.stringWidth(line + character) > width) {
                drawText(graphics, line.toString(), x, y + row * lineHeight);
                line.setLength(0);
                row++;
                if (row >= maxLines) {
                    return;
                }
            }
            if (points[index] != '\n') {
                line.append(character);
            }
        }
        drawText(graphics, line.toString(), x, y + row * lineHeight);
    }

    private byte[] png(BufferedImage image) {
        try {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            if (!ImageIO.write(image, "png", bytes)) {
                throw new BusinessException(ErrorCode.FILE_STORAGE_FAILED);
            }
            return bytes.toByteArray();
        } catch (IOException exception) {
            throw new BusinessException(ErrorCode.FILE_STORAGE_FAILED);
        }
    }
}
