import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OlTimelineComponent } from './timeline.component';
import { OlTimeService, OlZoneHelper } from '@angular-helpers/openlayers/core';
import { render, RenderResult } from '@angular-helpers/testing';

describe('OlTimelineComponent', () => {
  let result: RenderResult<OlTimelineComponent>;
  let component: OlTimelineComponent;
  let timeService: OlTimeService;

  beforeEach(async () => {
    result = await render(OlTimelineComponent, {
      providers: [OlTimeService, OlZoneHelper],
      inputs: {
        startTime: 1000,
        endTime: 5000,
        playSpeed: 10,
        loop: false,
      },
    });

    component = result.component;
    timeService = TestBed.inject(OlTimeService);
  });

  it('should initialize and set default values correctly', () => {
    expect(component).toBeTruthy();
    expect(component.startTime()).toBe(1000);
    expect(component.endTime()).toBe(5000);
    expect(component.currentTime()).toBe(1000);
    expect(component.speed()).toBe(10);
    expect(component.isPlaying()).toBe(false);
  });

  it('should toggle play and pause correctly', () => {
    const playSpy = vi.spyOn(timeService, 'play');
    const pauseSpy = vi.spyOn(timeService, 'pause');
    const playStateSpy = vi.spyOn(component.playStateChange, 'emit');

    component.togglePlay();
    expect(playSpy).toHaveBeenCalled();
    expect(playStateSpy).toHaveBeenCalledWith(true);

    // Mock play state
    vi.spyOn(timeService, 'isPlaying').mockReturnValue(true);
    component.togglePlay();
    expect(pauseSpy).toHaveBeenCalled();
    expect(playStateSpy).toHaveBeenCalledWith(false);
  });

  it('should handle scrubbing correctly', () => {
    const setTimeSpy = vi.spyOn(timeService, 'setTime');
    const timeChangeSpy = vi.spyOn(component.timeChange, 'emit');

    const mockEvent = {
      target: { value: '2500' },
    } as unknown as Event;

    component.onScrub(mockEvent);
    expect(setTimeSpy).toHaveBeenCalledWith(2500);

    TestBed.flushEffects();
    expect(timeChangeSpy).toHaveBeenCalledWith(2500);
  });

  it('should handle speed changes correctly', () => {
    const setSpeedSpy = vi.spyOn(timeService, 'setSpeed');

    const mockEvent = {
      target: { value: '60' },
    } as unknown as Event;

    component.onSpeedChange(mockEvent);
    expect(setSpeedSpy).toHaveBeenCalledWith(60);
  });

  it('should loop time-series when currentTime reaches endTime and loop is true', async () => {
    result.fixture.componentRef.setInput('loop', true);
    result.fixture.detectChanges();

    const setTimeSpy = vi.spyOn(timeService, 'setTime');

    // Simulate playing and reaching the end
    timeService.play();
    timeService.setTime(5500);
    result.fixture.detectChanges();
    TestBed.flushEffects();

    expect(setTimeSpy).toHaveBeenCalledWith(1000);
  });

  it('should stop playback when currentTime reaches endTime and loop is false', async () => {
    result.fixture.componentRef.setInput('loop', false);
    result.fixture.detectChanges();

    const pauseSpy = vi.spyOn(timeService, 'pause');
    const setTimeSpy = vi.spyOn(timeService, 'setTime');

    // Simulate playing and reaching the end
    timeService.play();
    timeService.setTime(5500);
    result.fixture.detectChanges();
    TestBed.flushEffects();

    expect(pauseSpy).toHaveBeenCalled();
    expect(setTimeSpy).toHaveBeenCalledWith(5000);
  });
});
