<?php

declare(strict_types=1);

// Memastikan folder fixture bersama (N-10) terjangkau dari API.
it('folder fixture bersama terbaca', function () {
    expect(dirname(__DIR__, 4).'/fixtures/README.md')->toBeFile();
});
